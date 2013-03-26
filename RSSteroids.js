if (Meteor.isClient) {  
//  Meteor.connect('http://neee.ws');
        
  Meteor.Router.add({
    '/': function() {
        Session.set('feedId', undefined);
        Session.set('page',0);
        return 'timeline'
    },
    '/timeline/:name': function(name) {
        var feed = feeds.findOne({title: name, userId: Meteor.userId()});
        if(!feed) return 'timeline';
        Session.set('feedId', feed._id);
        return 'timeline';
    },
    '/article/:title': function(title) {
        console.log(title);
        var article = articles.findOne({title: decodeURIComponent(title), userId: Meteor.userId()});
        articles.update({_id: article._id}, {'$set': {read: true}});
//        if(!feed) return 'timeline'; //Go back to the overall timeline, b/c there's no article.
        Session.set('article', article);
        return 'article';        
    }
  });    

  Deps.autorun(function() {
      console.log(Session.get('feedId'));
      Meteor.subscribe('articles', {
          feedId: Session.get('feedId'),
          page: Session.get('page'),
          searchPhrase: Session.get('searchPhrase')
      });
  });
  
  Deps.autorun(function() {
      Meteor.subscribe('feeds');
  });
  
  var articles = new Meteor.Collection("articles");
  var feeds = new Meteor.Collection("feeds");
  
  var refreshFeeds = function() {
      Meteor.setTimeout(refreshFeeds, 300000);
      if(Meteor.userId()) {
          Meteor.call("refreshFeeds");
      }
  };
  
  Meteor.startup(function() {
      Meteor.setTimeout(refreshFeeds, 0);
      Accounts.ui.config({
          requestPermissions: {
              google: ['http://www.google.com/reader/api']
          }
      });
  });
      
  /**
  * Global main template
  **/

  Template.main.userFirstname = function() {
      return Meteor.user().profile.name.split(' ')[0];
  };  

  Template.main.events({
      'keyup #search': function() {
          Session.set('searchPhrase', $('#search').val());
      }      
  });
  /**
  * Overall timeline
  **/
  Template.timeline.articles = function () {
      return articles.find().map(function(article) {
          article.slug = encodeURIComponent(article.title);
          return article;
      });
  };
    
  Template.timeline.page = function() { return Session.get('page'); };
  Template.timeline.searchPhrase = function() { return Session.get('searchPhrase'); };
    
  Template.timeline.events({
      'click #markAllRead': function() {
          Meteor.call('markAllRead', Session.get('feedId'));
      },
      'click #nextPage': function() {
          Session.set('page', (Session.get('page') || 0) + 1);
      },
      'click #prevPage': function() {
          Session.set('page', Math.max(Session.get('page')-1, 0));
      }
      
  });
  
  /**
  * The list of feeds (aside)
  **/

  Template.feedList.feeds = function() {
      return feeds.find().map(function(feed) {
          feed.unreadCount = articles.find({feedId: feed._id, read: {$ne: true}}).count();
          return feed;
      });
  }
  
  Template.feedList.isCurrentFeed = function(id) { return Session.get('feedId') === id; };
  Template.feedList.events({
      'click #googleImport': function() {
          Meteor.call('importFromGoogleReader');  
      },
      'click #addFeed': function() {
          Meteor.call('addFeed', $('#feedurl').val());
          $('#feedurl').val('');
      },
      'click .delete': function(event) {
          var feedId = $(event.target.parentElement).attr('id');
          var feedTitle = feeds.findOne({_id: feedId}).title;
          if(window.confirm("Really delete " + feedTitle + "?")) {
              feeds.remove({_id: feedId, userId: Meteor.userId()});
              articles.remove({feedId: feedId, userId: Metoer.userId()});
          }
      }
  });
  
  /**
  * Detail for an article
  **/
  
  Template.article.content = function() {
      return Session.get('article');
  }
}

/**
*
* SERVER
*
**/


if (Meteor.isServer) {
  
  var articles = new Meteor.Collection('articles');
  var feeds = new Meteor.Collection('feeds');

  var ARTICLES_PER_PAGE = 50;
  
  Meteor.publish('articles', function(params) {
      var selectors = { userId: this.userId };
      var options = {
          sort: [['read', 'asc'], ['date', 'desc']],
          limit: ARTICLES_PER_PAGE,
          skip: (params.page || 0) * ARTICLES_PER_PAGE,
          fields: {title: 1, read: 1, feedId: 1}
      };
      if(params.feedId) { selectors.feedId = params.feedId; }
      if(params.searchPhrase) {
          var looseMatching = new RegExp('.*' + params.searchPhrase + '.*', 'ig');
          selectors['$or'] = [
              { title: looseMatching },
              { content: looseMatching },
              { summary: looseMatching }
          ];
      }
      return articles.find(selectors, options);  
  });
    
  Meteor.publish('feeds', function() {
      return feeds.find({userId: this.userId}, {fields: {feedId: 1, title: 1}});
  });
  
  var require = __meteor_bootstrap__.require;    
  var feedparser = require('feedparser');
  
  var addArticle = function(feed) {
    //This way we pass the feed into the callback
    return function(article) {
      Fiber(function() {
        if(articles.findOne({feedId: feed._id, guid: article.guid})) return false;      
        articles.insert({
          feedId: feed._id,
          userId: feed.userId,
          title: article.title, 
          summary: article.summary,
          content: article.description,
          guid: article.guid,
          date: article.date,
          link: article.link,
          read: false,
        });
      }).run();
    };
  }
  
  var refreshFeeds = function () {
//      feeds.find({userId: this.userId}).forEach(refreshFeed);
  }
  
  //Parses feed for newer articles
  var refreshFeed = function(feed) {
      feedparser.parseUrl(feed.url).on('article', addArticle(feed))
          .on('error', function(error) { console.log("ERROR refreshing feed " + feed.url + ":" + error); });
  };
    
  //Called when metadata in a newly added feed is processed, gives information needed to add a new feed
  var addFeed = function(userId, url) {
    console.log("Add for URL: " + url + " UserID: " + userId);
    //This way we pass the url into the callback as well
    return function(meta) {
        Fiber(function() {
          feeds.insert({
            userId: userId,
            title: meta.title,
            url: url
          }, function(err, feedId) {
            if(feedId) {
              refreshFeed(feeds.findOne({_id: feedId})); //Parses the articles
            }
          });
        }).run();
    };
  };
  
  Meteor.methods({
      'refreshFeeds': refreshFeeds,
      'addFeed': function(url) {
          feedparser.parseUrl(url).on('meta', addFeed(this.userId, url));
      },
      'markAllRead': function(feedId) {              
          var selector = { read: {$ne: true}, userId: Meteor.userId() };
          if(feedId) { selector.feedId = feedId; }
          articles.update(selector, {$set: {read: true}}, {multi: true});
      },
      'importFromGoogleReader': function() {
          var accessToken = Meteor.user().services.google.accessToken;
          var userId = Meteor.userId();
          Meteor.http.get("https://www.google.com/reader/api/0/subscription/list?output=json",
              { headers: { Authorization: "Bearer " + accessToken } }, 
              function(err, result) {
                  for(var i=0;i<result.data.subscriptions.length; i++) {
                      var url = result.data.subscriptions[i].id.slice(5);
                      console.log(url);
                      addFeed(userId, url)(result.data.subscriptions[i]);     
                  }     
          });      
      }
  });
  
  Meteor.startup(function () {
    // code to run on server at startup    
  });
}
