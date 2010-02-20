// ==UserScript==
// @name           RottenFlix
// @namespace      http://www.mattblodgett.com/
// @description    Integrates Rotten Tomatoes ratings with Netflix.com
// @include        http://www.netflix.com/*
// ==/UserScript==

/*************************************************************************************/
// The code below is adapted from here: http://abeautifulsite.net/notebook/90
// This technique for loading jQuery was necessary because @require would not work.

var GM_jQuery = document.createElement('script');
GM_jQuery.src = 'http://ajax.googleapis.com/ajax/libs/jquery/1.3.2/jquery.min.js';
GM_jQuery.type = 'text/javascript';
document.getElementsByTagName('head')[0].appendChild(GM_jQuery);

function GM_wait() {
  if (typeof unsafeWindow.jQuery == 'undefined') {
    window.setTimeout(GM_wait, 100);
  } else {
    $ = unsafeWindow.jQuery;
    GM_ready();
  }
}
GM_wait();

function GM_ready() {
  setInterval(addRatings, 2000);
}


/**************************************************************************************/

function addRatings() {
  // get all the movie title links on the page
  var titleLinks = $(".title .mdpLink:not(.rottenFlixWasHere)");
  
  for (i in titleLinks) {
    var titleLink = titleLinks[i];
    var title = titleLink.innerHTML;
    
    // do we actually have a movie title to work with here?
    if (title) {
      $(titleLink).addClass("rottenFlixWasHere");
    
      // create a container element to hold our custom stuff
      var container = $("<span>");
      container.css("margin-left", "4px");
      
      // create a tomato image element
      var tomatoImage = $(createTomatoImage());
      
      // put the tomato image inside our container
      container.append(tomatoImage);
      
      // insert the container after this movie title link
      $(titleLink).after(container);
      
      // wire up the click event handler for this tomato image
      tomatoImage.get(0).addEventListener('click', tomatoClickHandler, true);
    }
  }
}


function tomatoClickHandler(event) {
  // get the tomato image element that triggered the click event
  var tomatoImage = $(event.target);
  
  // create a spinner image
  var spinnerImage = $(createSpinnerImage());
  
  // replace the tomato image with the spinner image
  tomatoImage.replaceWith(spinnerImage);
  
  // grab the movie title that this tomato goes along with
  var movieTitle = getMovieTitle(spinnerImage);
  
  // get the url for this movie on rottentomatoes.com
  var url = convertTitleToUrl(movieTitle);
  
  // fetch the rating at this url
  fetchRating(spinnerImage, url);
}


function createSpinnerImage() {
  return "<img height='12px' width='12px' src='http://gefopa.blu.livefilestore.com/y1pU30PwxAqpVdhluEE-RZiYA0XYeg3qp0X9sRZwaaPRT8QigtlLHNMR3tX6CD9heBzbZSfKTHarPxXdbic0qRa4lPDdyGTItXg/ajax-loader.gif' />";
}


function createTomatoImage() {
  return "<img title='Click for Rotten Tomatoes rating' style='cursor: pointer;' src='http://gefopa.blu.livefilestore.com/y1pkgFD68K9h2AvfiHarOzLvbr7conYQcC8iX61NlC-P7CyzdgytGg6winKXjQfogvQ1PXPRsa9VDIwbimbLfZQGFHNByx6BaSn/tomato_small.png' />";
}


function getReviewStatusFromRating(rawRating) {
  var reviewStatus = "";
  
  if (rawRating === null) {
    reviewStatus = "reviewNotFound";
  } else if (rawRating === "N/A") {
    reviewStatus = "reviewNA";
  } else {
    reviewStatus = "reviewNumber";
  }
  
  return reviewStatus;
}


function createRatingElement(rawRating, movieTitle) {
  var ratingElement = $("<a>");
  var html = "";
  var tooltip = "";

  var reviewStatus = getReviewStatusFromRating(rawRating);
  switch (reviewStatus) {
    case "reviewNotFound":
      html = "?";
      tooltip = "Search for this movie on Rotten Tomatoes";
      break;
    case "reviewNA":
      html = rawRating;
      tooltip = "View the page for this movie on Rotten Tomatoes";
      break;
    case "reviewNumber":
      html = rawRating + "%";
      tooltip = "View the page for this movie on Rotten Tomatoes";
      break;
  }
  
  ratingElement.css("color", getColorFromRating(rawRating));
  ratingElement.html(html);
  ratingElement.attr("href", convertTitleToUrl(movieTitle));
  ratingElement.attr("target", "_blank");
  ratingElement.attr("title", tooltip);
  
  return ratingElement;
}


function getColorFromRating(rawRating) {
  var color = "";
  
  var parsedRating = parseInt(rawRating);
  
  if (!isNaN(parsedRating)) {
    if (parsedRating >= 60) {
      color = "red";
    } else {
      color = "green";
    }
  } else {
    color = "black";
  }
  
  return color;
}


function getMovieTitle(customElement) {
  var movieTitleAnchor = customElement.parents(".title").children("a");
  var movieTitle = movieTitleAnchor.text();
  return movieTitle;
}


function convertTitleToUrl(title) {
  var rtUrl = "http://www.rottentomatoes.com/m/";
  title = removeSubtitles(title);
  title = title.toLowerCase().replace(/( |-)/g, "_").replace(/&/g, "and").replace(/('|,|\.|!|\?|\/|:|\[|\])/g, "").replace(/^(the|a|an)_/, "");
  rtUrl += title + "/";
  return rtUrl;
}


function removeSubtitles(title) {
  return title.replace(/(: Collector's Series|: Collector's Edition|: Director's Cut)/, "");
}


function deSrcHTML(html) {
  return html.replace(/src/g, "foo");
}


function fetchRating(elementToReplaceWithRating, rtUrl) {
  // make a cross-domain request for this url
  GM_xmlhttpRequest({
    method: 'GET',
    url: rtUrl,
    onload: function(responseDetails) {
      // get the HTML document that we received
      var responseHTML = responseDetails.responseText;
      
      // don't fetch images and scripts and such embedded in the HTML
      responseHTML = deSrcHTML(responseHTML);
      
      // parse out the rating text from the HTML
      var rating = $('#tomatometer_score span', responseHTML).html();
      
      var movieTitle = getMovieTitle(elementToReplaceWithRating);
      
      // create an element in which to display this rating
      var ratingElement = createRatingElement(rating, movieTitle);
      
      // swap in the rating element
      elementToReplaceWithRating.replaceWith(ratingElement);
    },
    onerror: function(responseDetails) {
      console.log("failure");
    }
  });
}
