(function() {
  "use strict";

  // TAYmer
  var TAYmer = function () {
    var TIME_LOGS_PATH = 'timeLogs';
    var ACTIVE_TIMER_PATH = 'activeTimer';
    var user = localStorage.getItem('TAYmer.user');
    var timerRef;
    var logRef;
    var FBTimer = { itemId: false, status: 0, startTime: false };
    var title = $('head title');
    var timerInteval;
    var watch;

    var getDiffInString = function() {
      var seconds, minutes, hours, time, loggedTime = Date.now();
      var diffS = (loggedTime - FBTimer.startTime) / 1000;
      if (FBTimer.startTime == false || diffS < 1) {
        return "00:00:00";
      }
      // 2- Extract hours:
      hours = parseInt( diffS / 3600 ); // 3,600 seconds in 1 hour
      diffS = diffS % 3600; // seconds remaining after extracting hours
      // 3- Extract minutes:
      minutes = parseInt( diffS / 60 ); // 60 seconds in 1 minute
      // 4- Keep only seconds not extracted to minutes:
      seconds = parseInt(diffS % 60);
      time = ('0' + hours).substr(-2) + ':' +
        ('0' + minutes).substr(-2) + ':' +
        ('0' + seconds).substr(-2);
      return time;
    };

    var getStartTimeInString = function() {
      var minutes, hours, time, loggedTime = new Date(FBTimer.startTime);
      // Hours part from the timestamp
      hours = loggedTime.getHours();
      // Minutes part from the timestamp
      minutes = "0" + loggedTime.getMinutes();
      // Will display time in 10:30 format
      time = hours + ':' + minutes.substr(-2);
      return time;
    };

    var startFBTimer = function() {
      var hash = location.hash.split("/");
      if (hash[0] == "#tasks" && $.isNumeric(hash[1])) {
        $('.yo-timer-watch').addClass('yo-timer-running');

        localStorage.setItem('TAYmer.title', title.text());
        var add = function() {
          title.text(getDiffInString());
          watch.find('.yo-timer-time').text(getDiffInString());
        };
        var initTimer = function() {
          timerInteval = setInterval(add, 1000);
        };
        setTimeout(initTimer, (parseInt(Date.now()/1000) * 1000 + 1000) - Date.now());

        updateFBTimer({ itemId: hash[1], status: 1, startTime: parseInt(Date.now() / 1000) * 1000 + 1000 });
      }
      else {
        alert('Could not get a task ID.')
      }
    };

    var stopFBTimer = function() {
      var loggedTime = Date.now(), diffS, hours, minutes, seconds;
      var loggedDate = new Date();
      diffS = (loggedTime - FBTimer.startTime) / 1000;
      // 2- Extract hours:
      hours = parseInt( diffS / 3600 ); // 3,600 seconds in 1 hour
      diffS = diffS % 3600; // seconds remaining after extracting hours
      // 3- Extract minutes:
      minutes = parseInt( diffS / 60 ); // 60 seconds in 1 minute
      if (minutes === 0) {
        minutes = 1;
      }

      $('.yo-timer-watch').removeClass('yo-timer-running');
      // $('body').removeClass('yo-timer-running');
      clearInterval(timerInteval);

      logTime(FBTimer.itemId, hours + ':' + minutes, loggedDate);
      updateFBLog(loggedTime, loggedDate, hours + ':' + minutes);

      // Reset
      FBTimer = { itemId: false, status: 0, startTime: false };
      watch.find('.yo-timer-time').text(getDiffInString());
      title.text(localStorage.getItem('TAYmer.title'));
    };

    var updateFBTimer = function(params) {
      timerRef.set(params);
    };

    var toggleFBTimer = function () {
      if (FBTimer.status === 0) {
        // Run timer.
        startFBTimer();
      }
      else {
        // Stop timer.
        stopFBTimer();
      }
    };

    var logTime = function(itemId, effortSpent, loggedTime) {
      // ToDo: log time to TW
      alert('ToDo: log time to TW')
    };

    var updateFBLog = function(endTime, endDate, duration) {
      logRef.child(endTime).set({
        itemId : FBTimer.itemId,
        startTime : FBTimer.startTime,
        endTime : endTime,
        loggedTime : endDate.toLocaleString(),
        duration : duration
      });
    };

    var createDomTimer = function () {
      watch = $('.yo-timer-watch');
      if (watch.length < 1) {
        // Create the stop-watch
        watch = $('<div class="yo-timer-watch" />');
        watch.append('<time class="yo-timer-time">' + getDiffInString() + '</time>');
        watch.append(
          $('<time />')
            .addClass('yo-timer-edit')
            .text(getStartTimeInString())
            .prop('contenteditable', true)
            .keypress(function (e) {
              if (e.which === 13) {
                e.preventDefault();
                toggleTimeEdit();
              }
            })
        );
        watch.prepend($('<i title="Edit time" class="icon icon-edit"></i>').click(function () {
          toggleTimeEdit();
        }));
        watch.append($('<i title="Toggle timer" class="icon icon-play"></i>').click(function () {
          toggleFBTimer();
        }));
        // watch.prepend($('<div class="timer-task">Ticket #' + FBTimer.itemId + '</div>').click(function () {
        //   openItemDetails();
        // }));
        watch.appendTo('body');
      }
    }
    createDomTimer();

    var timerValueCallback = function (snapshot) {
      var newVal = snapshot.val();
      var action;
      if (FBTimer.status === 0 && newVal.status === 1) {
        // ToDo: wrong logic here
        // Start timer.
        action = 'start';
      }
      else if (FBTimer.status === 1 && newVal.status === 0) {
        // Stop timer
        action = 'stop';
      }
      FBTimer = newVal;
      if (action == 'start') {
        startFBTimer();
      }
      else if (action == 'stop') {
        stopFBTimer();
      }
    };

    var setFBRef = function() {
      timerRef = new Firebase("https://yotimer.firebaseio.com/" + ACTIVE_TIMER_PATH + "/" + user);
      logRef = new Firebase("https://yotimer.firebaseio.com/" + TIME_LOGS_PATH + "/" + user);
      timerRef.on("value", timerValueCallback, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
      });
    };
    setFBRef();

  };

  // http://stackoverflow.com/a/14901197/1660055
  // Inject TAYmer() into page.
  var execute = function (body) {
    if(typeof body === "function") { body = "(" + body + ")();"; }
    var el = document.createElement("script");
    el.textContent = body;
    document.body.appendChild(el);
    return el;
  };

  // Load Firebase script fron CDN.
  var load = function (src, on_load, on_error) {
     var el = document.createElement("script");
     el.setAttribute("src", src);
     if (on_load !== null) { el.addEventListener("load", on_load); }
     if (on_error !== null) { el.addEventListener("error", on_error); }
     document.body.appendChild(el);
     return el;
  };

  chrome.extension.sendMessage({}, function(response) {

    var readyStateCheckInterval = setInterval(function() {
      if (document.readyState === "complete") {
        clearInterval(readyStateCheckInterval);

        chrome.storage.sync.get({
          TAYmerUid: ''
        }, function(items) {
          localStorage.setItem('TAYmer.user', items.TAYmerUid);
        });

        load("https://cdn.firebase.com/js/client/2.4.2/firebase.js", function () {
          execute(TAYmer);
        });

     }
    }, 100);

  });

})();
