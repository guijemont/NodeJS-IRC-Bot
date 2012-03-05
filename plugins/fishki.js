/**
 * Fishki plugin: provides translation for fishki links
 *
 * @author        Guillaume Emont
 * @website        http://emont.org/
 * @copyright    Guillaume Emont 2012
 */

var url = require ('url'),
    http = require ('http');

Plugin = exports.Plugin = function (irc) {
    this.name = 'fishki';
    this.title = 'fishki translator';
    this.version = '0.1';
    this.author = 'Guillaume Emont';

    this.irc = irc;
};

var fishkiHandler = function () {
  var en_url_regexp = RegExp('<a href="(http://en.fishki.net/comment.php\\?id=\\d+)"[^>]*>');

  return function (page_url_) {
    var page_url = page_url_,
        that = {};

    var parse_url = function (url_) {
      var options = url.parse (url_);
      options.path = options.pathname + options.search;
      return options;
    }

    that.english_url = function (callback) {
      var page_data = "";

      http.get (parse_url (page_url), function (response) {
                response.on ('data', function (data) {
                             page_data += data;
                             });
                response.on ('end', function () {
                             var match;
                             //console.log (page_data);
                             console.log ("got %d bytes for %s", page_data.length, page_url);
                             match = en_url_regexp.exec (page_data);
                             if (match === null) {
                             console.log ("Could not find english url for %s",
                                          page_url);
                             callback (null);
                             } else {
                             callback (match[1]);
                             }
                             });
                });
    };

    return that;
  }
}();


Plugin.prototype.onMessage = function() {
    var url_regex = RegExp ("http://.*fishki.net/comment.php\\?id=\\d+");

    return function (msg) {
        var channel = msg.arguments[0],
            message = msg.arguments[1],
            regex_result,
            original_url,
            irc = this.irc,
            fishki;

        regex_result = url_regex.exec(message);
        if (regex_result !== null) {
            original_url = regex_result[0];
            fishki = fishkiHandler (original_url);
            fishki.english_url (function (english_url) {
                if (english_url !== null) {
                    irc.channels[channel].send ("In English: " + english_url);
                }
            });
        }
    };
}();

/* The stuff below is used for testing only */
var main = function () {
    var page_url = process.argv[2],
        fishki;

    console.log ("Got url:", page_url);

    fishki = fishkiHandler (page_url);
    fishki.english_url (function (en_url) {
        console.log ("English url is:", en_url);
    });
}

if (module.parent === null) {
    if (process.argv.length !== 3) {
        console.log ("Syntax: %s %s url", process.argv[0], process.argv[1]);
    } else {
        main ();
    }
}
