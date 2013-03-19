var articles = new Meteor.Collection('articles');
var feeds = new Meteor.Collection('feeds');

if (Meteor.isClient) {
  Template.hello.articles = function () {
      return articles.find({},{sort: [["date", "desc"]]}).fetch();
  };

  Template.hello.userFirstname = function() {
      return Meteor.user().profile.name.split(" ")[0];
  };
  
  Template.feedList.feeds = function() {
      return feeds.find().fetch();
  }
  
  Template.hello.events({
      "click #refresh": function() {
          Meteor.call("refreshFeeds");
      }
  });
  
  Template.feedList.events({
      "click button": function() {
          Meteor.call("addFeed", $("#feedurl").val());
          $("#feedurl").val("");
      }
  });
}

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
          title: article.title, 
          content: article.summary,
          guid: article.guid,
          date: article.date
        });
        console.log("Found article '" + article.title + "'");
      }).run();
    };
  }
  
  var refreshFeeds = function (userId) {
      feeds.find({userId: userId}).forEach(refreshFeed);
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
