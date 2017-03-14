(function() {

    var player,
        container = document.getElementById('player'),
        controls = document.getElementById('controls'),
        spinner = document.getElementById('spinner-panel'),
        thumbSeeking = false,
        initialThumbX = 0,
        seekTarget = 0;

    function clamp(val) {
        if (val < 0) {
            return 0;
        } else if (val > 1) {
            return 1;
        } else {
            return val;
        }
    }

    function updateProgress() {
        if (player) {
            var total = player.duration,
                processed = player.currentTime,
                thumb = (thumbSeeking ? seekTarget : processed),
                buffered = 0,
                ranges = player.buffered;
            if (ranges.length) {
                // hack -- find the range that contains current, if any
                // would be better to show the actual multi ranges :D
                for (var i = 0; i < ranges.length; i++) {
                    if (processed >= ranges.start(i) && processed <= ranges.end(i)) {
                        buffered = ranges.end(i);
                        break;
                    }
                }
            }

            function percent(val) {
                var ratio = val / total,
                    percentage = ratio * 100.0;
                return percentage + '%';
            }

            document.getElementById('progress-total').title = total;
            document.getElementById('progress-buffered').style.width = percent(buffered);
            document.getElementById('progress-processed').style.width = percent(processed);
            document.getElementById('progress-thumb').style.left = percent(thumb);

            function simtrunc(val) {
                if (val >= 0) {
                    return Math.floor(val);
                } else {
                    return Math.ceil(val);
                }
            }
            var trunc = Math.trunc || simtrunc;

            function formatTime(time) {
                var rtime = Math.round(time),
                    minutes = trunc(rtime / 60),
                    seconds = Math.abs(rtime % 60),
                    padding = (seconds < 10) ? '0' : '';
                return minutes + ':' + padding + seconds;
            }

            controls.querySelector('.time-elapsed').textContent = formatTime(thumb);
            if (player.duration < Infinity) {
                controls.querySelector('.time-remaining').textContent = formatTime(thumb - total);
            } else {
                controls.querySelector('.time-remaining').textContent = '';
            }
        }
    }

    function onclick(selector, listener) {
        var el = controls.querySelector(selector);

        el.addEventListener('click', listener);

        el.addEventListener('touchstart', function(event) {
            // :active doesn't work on iOS \o/
            el.classList.add('active');
            event.preventDefault();
        });
        el.addEventListener('touchcancel', function(event) {
            el.classList.remove('active');
            event.preventDefault();
        });
        el.addEventListener('touchend', function(event) {
            el.classList.remove('active');
            event.preventDefault();
            listener();
        });
    }

    onclick('.play', function() {
        if (player) {
            player.play();
        }
    });
    onclick('.pause', function() {
        if (player) {
            player.pause();
        }
    });
    onclick('.mute', function() {
        if (player) {
            player.muted = true;
        }
        controls.querySelector('.mute').style.display = 'none';
        controls.querySelector('.unmute').style.display = 'inline';
    });
    onclick('.unmute', function() {
        if (player) {
            player.muted = false;
        }
        controls.querySelector('.mute').style.display = 'inline';
        controls.querySelector('.unmute').style.display = 'none';
    });
    function doFastSeek(seekTarget) {
        if (typeof player.fastSeek == 'function') {
            player.fastSeek(seekTarget);
        } else {
            player.currentTime = seekTarget;
        }
    }
    var onNextSeek;
    function setNextSeek() {
        updateProgress();

        if (onNextSeek) {
            // delay!
        } else {
            var onseeked = function() {
                player.removeEventListener('seeked', onseeked);
                onNextSeek = null;
                if (thumbSeeking) {
                    setNextSeek();
                }
            };
            onNextSeek = onseeked;
            player.addEventListener('seeked', onseeked);
            doFastSeek(seekTarget);
        }
    }
    function clearNextSeek() {
        if (onNextSeek) {
            player.removeEventListener('seeked', onNextSeek);
            onNextSeek = null;
        }
    }
    document.querySelector('#progress-total').addEventListener('click', function(event) {
        if (player && player.seekable.length) {
            var x = event.offsetX,
                fraction = x / this.offsetWidth,
                seekTime = fraction * player.duration;
            doFastSeek(seekTime);
        }
    });
    if (window.PointerEvent) {
        document.querySelector('#progress-thumb').addEventListener('pointerdown', function(event) {
            console.log('touch start');
            if (player && player.seekable.length) {
                var thumbPointer = event.pointerId;
                event.target.setPointerCapture(thumbPointer);

                thumbSeeking = true;
                seekTarget = player.currentTime;
                initialThumbFraction = seekTarget / player.duration;
                initialThumbX = event.clientX;

                var ontouchmove = function(event) {
                    console.log('touch move');
                    var bar = document.querySelector('#progress-total'),
                        dx = event.clientX - initialThumbX,
                        fraction = clamp(initialThumbFraction + dx / bar.offsetWidth);
                    seekTarget = fraction * player.duration;
                    setNextSeek();
                    event.preventDefault();
                };
                var ontouchup = function(event) {
                    console.log('touch up');
                    thumbSeeking = false;
                    clearNextSeek();
                    player.currentTime = seekTarget;
                    updateProgress();

                    this.removeEventListener('pointermove', ontouchmove);
                    this.removeEventListener('pointerup', ontouchup);
                    this.removeEventListener('pointercancel', ontouchup);
                    event.preventDefault();
                    event.target.releasePointerCapture(thumbPointer);
                };
                this.addEventListener('pointermove', ontouchmove);
                this.addEventListener('pointerup', ontouchup);
                this.addEventListener('pointercancel', ontouchup);
            }
            event.preventDefault();
        });
    } else {
        document.querySelector('#progress-thumb').addEventListener('touchstart', function(event) {
            console.log('touch start');
            if (player && player.seekable.length) {
                thumbSeeking = true;
                seekTarget = player.currentTime;
                initialThumbFraction = seekTarget / player.duration;
                initialThumbX = event.touches[0].pageX;

                var ontouchmove = function(event) {
                    console.log('touch move');
                    var bar = document.querySelector('#progress-total'),
                        dx = event.touches[0].pageX - initialThumbX,
                        fraction = clamp(initialThumbFraction + dx / bar.offsetWidth);
                    seekTarget = fraction * player.duration;
                    setNextSeek();
                    event.preventDefault();
                };
                var ontouchup = function(event) {
                    console.log('touch up');
                    thumbSeeking = false;
                    clearNextSeek();
                    player.currentTime = seekTarget;
                    updateProgress();

                    this.removeEventListener('touchmove', ontouchmove);
                    this.removeEventListener('touchend', ontouchup);
                    this.removeEventListener('touchcancel', ontouchup);
                    event.preventDefault();
                };
                this.addEventListener('touchmove', ontouchmove);
                this.addEventListener('touchend', ontouchup);
                this.addEventListener('touchcancel', ontouchup);
            }
            event.preventDefault();
        });
        document.querySelector('#progress-thumb').addEventListener('mousedown', function(event) {
            if (player && player.seekable.length) {
                thumbSeeking = true;
                seekTarget = player.currentTime;
                initialThumbFraction = seekTarget / player.duration;
                initialThumbX = event.clientX;

                var onmove = function(event) {
                    var bar = document.querySelector('#progress-total'),
                        dx = event.clientX - initialThumbX,
                        fraction = clamp(initialThumbFraction + dx / bar.offsetWidth);
                    seekTarget = fraction * player.duration;
                    setNextSeek();
                    event.preventDefault();
                };
                var onmouseup = function(event) {
                    var bar = document.querySelector('#progress-total'),
                        dx = event.clientX - initialThumbX,
                        fraction = clamp(initialThumbFraction + dx / bar.offsetWidth);
                    seekTarget = fraction * player.duration;
                    thumbSeeking = false;
                    clearNextSeek();
                    player.currentTime = seekTarget;
                    updateProgress();

                    document.removeEventListener('mousemove', onmove);
                    document.removeEventListener('mouseup', onmouseup);
                    event.preventDefault();
                };
                document.addEventListener('mousemove', onmove);
                document.addEventListener('mouseup', onmouseup);
            }
            event.preventDefault();
        });
    }

    onclick('.fullscreen', function() {
        var requestFullscreen = (container.requestFullscreen || container.mozRequestFullScreen || container.webkitRequestFullscreen || container.msRequestFullscreen).bind(container);
        requestFullscreen();
    });
    onclick('.unzoom', function() {
        var cancelFullscreen = (document.cancelFullscreen || document.mozCancelFullScreen || document.webkitCancelFullScreen || document.msExitFullscreen).bind(document);
        cancelFullscreen();
    });
    function fullResizeVideo() {
        var fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
        if (fullscreenElement == container) {
            controls.querySelector('.fullscreen').style.display = 'none';
            controls.querySelector('.unzoom').style.display = 'inline';
        } else {
            controls.querySelector('.fullscreen').style.display = 'inline';
            controls.querySelector('.unzoom').style.display = 'none';
        }
    }
    document.addEventListener('fullscreenchange', fullResizeVideo);
    document.addEventListener('mozfullscreenchange', fullResizeVideo);
    document.addEventListener('webkitfullscreenchange', fullResizeVideo);
    document.addEventListener('MSFullscreenChange', fullResizeVideo);

    var controlPanel = document.getElementById('control-panel');
    var playerTimeout;
    function hideControlPanel() {
        // don't hide if we're paused
        // @todo or are audio-only
        if (player && !player.paused) {
            if (controlPanel.style.opacity == 1.0) {
                controlPanel.style.opacity = 0.0;
            }
        }
        if (playerTimeout) {
            clearTimeout(playerTimeout);
            playerTimeout = null;
        }
    }
    function delayHideControlPanel() {
        playerTimeout = setTimeout(function() {
            playerTimeout = null;
            if (player && !player.paused) {
                controlPanel.style.opacity = 0.0;
            }
        }, 5000);
    }
    function showControlPanel() {
        if (controlPanel.style.opacity == 0.0) {
            controlPanel.style.opacity = 1.0;
        }
        if (playerTimeout) {
            clearTimeout(playerTimeout);
            playerTimeout = null;
        }
    }
    function onmousemove() {
        showControlPanel();
        delayHideControlPanel();
    }
    container.addEventListener('mousemove', onmousemove);
    container.addEventListener('touchstart', function() {
        // mousemove triggers on taps in iOS, which undoes our attempts to hide
        container.removeEventListener('mousemove', onmousemove);
    });

    var seekSpinnerTimeout;
    window.controls = {
        init: function(aPlayer) {
            player = aPlayer;
            
            spinner.classList.add('loading');
            player.addEventListener('loadedmetadata', function() {
                spinner.classList.remove('loading');
                updateProgress();
            });

            spinner.classList.remove('seeking');
            player.addEventListener('seeking', function() {
                // use a timeout so very short seeks don't throw up a spinner
                if (seekSpinnerTimeout) {
                    clearTimeout(seekSpinnerTimeout);
                }
                seekSpinnerTimeout = setTimeout(function() {
                    spinner.classList.add('seeking');
                }, 250);
            });
            player.addEventListener('seeked', function() {
                if (seekSpinnerTimeout) {
                    clearTimeout(seekSpinnerTimeout);
                    seekSpinnerTimeout = null;
                }
                spinner.classList.remove('seeking');
            });

            spinner.classList.remove('error');
            spinner.textContent = '';
            player.addEventListener('error', function() {
              spinner.classList.add('error');
              var err = player.error;
              var msg;
              if (err) {
                if (err.code === err.MEDIA_ERR_ABORTED) {
                  msg = 'aborted by user';
                } else if (err.code === err.MEDIA_ERR_NETWORK) {
                  msg = 'network error';
                } else if (err.code === err.MEDIA_ERR_DECODE) {
                  msg = 'decode error';
                } else if (err.code === err.MEDIA_ERR_SRC_NOT_SUPPORTED) {
                  msg = 'source not supported';
                } else {
                  msg = 'unknown error';
                }
                if (err.message) {
                  msg += ': ' + err.message;
                }
              } else {
                msg = 'invalid error state';
              }
              spinner.textContent = 'Error: ' + msg;
            });

            player.addEventListener('timeupdate', function() {
                updateProgress();
            });


            player.addEventListener('ended', function() {
                updateProgress();
                showControlPanel();
            });

            player.addEventListener('pause', function() {
                updateProgress();
                showControlPanel();
            });

            player.addEventListener('play', function() {
                delayHideControlPanel();
            });

            showControlPanel();

            function showHideControls(event) {
                if (controlPanel.style.opacity == 1.0) {
                    hideControlPanel();
                } else {
                    showControlPanel();
                }
            }
            player.addEventListener('touchstart', showHideControls);
            // If the spinner is up, it'll block touches to the player.
            spinner.addEventListener('touchstart', showHideControls);

            document.querySelector('.play').style.display = 'inline';
            document.querySelector('.pause').style.display = 'none';
            player.addEventListener('play', function() {
                document.querySelector('.play').style.display = 'none';
                document.querySelector('.pause').style.display = 'inline';
            });
            player.addEventListener('pause', function() {
                document.querySelector('.play').style.display = 'inline';
                document.querySelector('.pause').style.display = 'none';
            });
            player.addEventListener('ended', function() {
                document.querySelector('.play').style.display = 'inline';
                document.querySelector('.pause').style.display = 'none';
            });
            if (player.muted) {
                controls.querySelector('.mute').style.display = 'none';
                controls.querySelector('.unmute').style.display = 'inline';
            } else {
                controls.querySelector('.mute').style.display = 'inline';
                controls.querySelector('.unmute').style.display = 'none';
            }

            updateProgress();
        }
    }
})();