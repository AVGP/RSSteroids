var articles = new Meteor.Collection('articles');
var feeds = new Meteor.Collection('feeds');

if (Meteor.isClient) {
  Meteor.connect('http://neee.ws');
  var refreshFeeds = function() {
      Meteor.setTimeout(refreshFeeds, 60000);
      if(Meteor.userId()) {
          Meteor.call("refreshFeeds");
      }
  };
  
  Meteor.startup(function() {
      Meteor.setTimeout(refreshFeeds, 0);
  });
      
  Meteor.Router.add({
    '/': function() {
        Session.set('feedId', undefined);
        return 'timeline'
    },
    '/timeline/:name': function(name) {
        var feed = feeds.findOne({title: name, userId: Meteor.userId()});
        if(!feed) return 'timeline';
        Session.set('feedId', feed._id);
        return 'timeline';
    },
    '/article/:title': function(title) {
        var article = articles.findOne({title: title, userId: Meteor.userId()});
//        if(!feed) return 'timeline'; //Go back to the overall timeline, b/c there's no article.
        Session.set('article', article);
        return 'article';        
    }
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
      var selectors = { userId: Meteor.userId() };
      if(Session.get('feedId')) { selectors.feedId = Session.get('feedId'); }
      if(Session.get('searchPhrase')) {
          var looseMatching = new RegExp('.*' + Session.get('searchPhrase') + '.*', 'ig');
          selectors['$or'] = [
              { title: looseMatching },
              { content: looseMatching },
              { summary: looseMatching }
          ];
      }
      console.log(selectors);
      return articles.find(selectors, {sort: [['date', 'desc']]}).fetch();
  };
    
  Template.timeline.searchPhrase = function() { return Session.get('searchPhrase'); };
    
  Template.timeline.events({
      'click #refresh': function() {
          Meteor.call('refreshFeeds');
      }
  });
  
    /**
  * The list of feeds (aside)
  **/

  Template.feedList.feeds = function() {
      return feeds.find({userId: Meteor.userId()}).fetch();
  }

  Template.feedList.isCurrentFeed = function(id) { return Session.get('feedId') === id; };
  Template.feedList.events({
      'click button': function() {
          Meteor.call('addFeed', $('#feedurl').val());
          $('#feedurl').val('');
      }
  });
  
  /**
  * Detail for an article
  **/
  
  Template.article.content = function() {
      console.log(Session.get('article'));
      return Session.get('article');
  }
}

/**
*
* SERVER
*
**/


if (Meteor.isServer) {
  
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
          link: article.link
        });
      }).run();
    };
  }
  
  var refreshFeeds = function () {
      console.log('Refreshing for ' + this.userId);
      feeds.find({userId: this.userId}).forEach(refreshFeed);
  }
  
  //Parses feed for newer articles
  var refreshFeed = function(feed) {
      feedparser.parseUrl(feed.url).on('article', addArticle(feed));
  };
    
  //Called when metadata in a newly added feed is processed, gives information needed to add a new feed
  var addFeed = function(userId, url) {
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
      }
  });
  
  Meteor.startup(function () {
    // code to run on server at startup    
  });
}
