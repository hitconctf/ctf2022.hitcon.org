var mode = localStorage.getItem('challenge_mode');
if (mode == "unsolved") {
    var btn_active = $("#btn-unsolved");
    var btn_disable = $("#btn-all");
} else {
    var btn_active = $("#btn-all");
    var btn_disable = $("#btn-unsolved");
}

btn_active.addClass('active btn-primary');
btn_active.removeClass('btn-default');

btn_disable.removeClass('active btn-primary');
btn_disable.addClass('btn-default');

var md = window.markdownit({
    breaks: true,
});
var challenges = null;

var update_mini_scoreboard = function(){
    $.getJSON("/dashboard/mini_scoreboard_data", function(data) {
        var entries = "";
        var is_top_teams = false;
        var top_teams = data.slice(0, 20);
        for (var i in top_teams) {
            var team = top_teams[i];
            if (team.id == team_id) {
                entries += '<li class="self">';
                is_top_teams = true;
            } else {
                entries += "<li>";
            }
            entries += "<span>" + escape_html(team.name) + "</span>";
            entries += "<span class='pull-right'>" + escape_html(team.score) + "</span>";
            entries += "</li>";
        }
        if (!is_top_teams) {
            for (var i = 20; i < data.length; i++ ) {
                var team = data[i];
                if (team.id == team_id) {
                    entries += '<li class="self">';
                    entries += "<span>" + escape_html(team.name) + "</span>";
                    entries += "<span class='pull-right'>" + escape_html(team.score) + "</span>";
                    entries += '</li>';
                    break;
                }
            }
        }
        $("#mini-scoreboard").html(entries);
    });
};
update_mini_scoreboard();
setInterval(update_mini_scoreboard, refresh_interval);

var update_dashboard_challenges = function(){
    $.getJSON("/dashboard/challenge_data", function(data) {
        challenges = data;
        var entries = '<ul id="challenge-list">';
        for (var i in data) {
            challenge = data[i];
            if ( mode == "unsolved" && challenge.solved )
                continue;

            entries += '<li class="challenge-entry unlocked" id="challenge-id-' + challenge.id + '">';
            entries += '<div class="challenge-info">';
            entries += '<div class="title"><p>';
            entries += '<span class="tititle">' + challenge.name + '</span><br>';
            entries += '<span class="tags">' + challenge.category + '</span><br>';
            if ( !challenge.is_opened )
                entries += '<span class="text-muted small">Locked</span>';

            entries += '</p></div></div>';
            entries += '<ul class="flag-list">';
            entries += '<li id="flag-id-' + challenge.id + '" class="';
            if (challenge.solved)
                entries += 'solved';
            else if (challenge.solved_times != 0)
                entries += ' other-solved'
            entries += '">' + challenge.score + '</li></ul>';
            entries += '<div class="clearfix"></div>';
            entries += "</li>";
        }
        entries += '<div class="clearfix"></div>';
        entries += "</ul>";
        $("#dashboard-challenges").html(entries);

        if (!$("#challenge-modal").hasClass('in')) {
          if ( window.location.hash ) {
              var hash = window.location.hash.substring(1);
              if ( !isNaN(hash) )
                  $("#challenge-id-" + hash).click();
          }
        }
    });
};
update_dashboard_challenges();
setInterval(update_dashboard_challenges, refresh_interval);

$("#flag_submit_button").on("click", function () {
    $(this).prop('disabled', true);
    $('#submit-status').text('');
    $('#submit-status').hide();

    setTimeout(function(){
        $("#flag_submit_button").prop('disabled', false);
    }, 1000);

    $.post ("/dashboard/submit_flag", {
        "flag": $("#flag_input").val().trim(),
        "id": $(this).data("href"),
    },
    function (data, textStatus, jqXHR) {
        if (data == 'error') {
            $('#submit-status').text('Slow down! submit your flag later.');
            $('#submit-status').show();
        } else if (data == 'duplicated') {
            $('#submit-status').text('You already submit this flag!');
            $('#submit-status').show();
            $('#flag').val('')
        } else if (data == 'wrong') {
            $('#submit-status').text('Wrong flag. Noooooo~');
            $('#submit-status').show();
        } else {
            var challenge_obj = $("#flag-id-" + data);
            challenge_obj.fadeOut(400, function(){
                challenge_obj.removeClass('other-solved');
                challenge_obj.addClass('solved');
                challenge_obj.fadeIn(400);
            });
            $('#submit-form').hide('100');
            $('#submit-status').text('Correct flag. Grats!');
            $('#submit-status').show();
            update_announcements();
        }
    }).fail(function(){
        $('#submit-status').text('Submission error. Please try again later.');
        $('#submit-status').show();
    });
});

$("#flag_input").on("keyup", function (e) {
    var code = (e.keyCode ? e.keyCode : e.which);
    if ( code == 13 ) {
        $("#flag_submit_button").click();
    }
});

// handling function for successfully fetching announcements
function fetch_announcements_success(data)
{
    elem_ul = $("#dashboard-announcements > ul");
    curr_count = elem_ul.children().length;
    is_first_query = (curr_count == 0);

    for (index = data.length - curr_count - 1; index >= 0; index--) {
        announcement = data[index];

        elem_description = $("<div></div>")
            .text(announcement["description"])
            .css("display", "none");

        if ( announcement["description"].length )
            elem_title = $("<a></a>");
        else
            elem_title = $("<p></p>");

        elem_title.text(announcement["time"] + ": " + announcement["title"])
            .attr("href", "javascript:void(0)")
            .click(function() {
                $(this).parent().children("div").slideToggle('fast');
            });

        elem_entry = $("<li></li>")
            .append(elem_title)
            .append(elem_description);

        if (is_first_query) {
            elem_entry.prependTo(elem_ul);
        } else {
            elem_entry.prependTo(elem_ul).slideDown().fadeOut().fadeIn().fadeOut().fadeIn();
        }
    }
}

// handling function for failing to fetch announcements
function fetch_announcements_fail(jqXHR)
{
    console.error('failed to fetch announcements');
}

// periodly update announcements
function update_announcements()
{
    $.ajax({url: window.location.origin + "/dashboard/announcement_data",
        dataType: "json",
        success: fetch_announcements_success,
        error: fetch_announcements_fail});
}

update_announcements();
setInterval(update_announcements, refresh_interval);

// challenge info popup
$(document).on('click', '.challenge-entry.unlocked', function(){
    var chall_id = this.id.split("-").pop();
    for ( var i in challenges ) {
        if (challenges[i].id == chall_id) {
            challenge = challenges[i];
            break;
        }
    }

    var modal = $('#challenge-modal');
    modal.find('#challenge-solved-team').hide();
    modal.find("#challenge-solved-team").html("");
    modal.find('.modal-title').text(challenge.name + ' [' + challenge.score + 'pts]');
    modal.find('#challenge-description').html(md.render(challenge.description));
    if ( challenge.author )
        modal.find('#challenge-author').html("Author: " + challenge.author);
    else
        modal.find('#challenge-author').html("");


    if ( challenge.hint ) {
        var entries = "";
        for ( var i in challenge.hint ) {
            entries += '<strong>Hint</strong>';
            if (contest_end) {
                entries += '<span class="text-muted pull-right">'
                    + moment.utc(challenge.hint[i].public_time * 1000).format("YYYY-MM-DD HH:mm:ss UTC") + '</span>';
            } else {
                entries += '<span class="text-muted pull-right" data-toggle="tooltip" data-placement="left" title="'
                    + moment(challenge.hint[i].public_time * 1000).format("YYYY-MM-DD HH:mm:ss") + '">'
                    + moment(challenge.hint[i].public_time * 1000).fromNow() + '</span>';
            }
            entries += '<span>' + md.render(challenge.hint[i].content) + '</span>';
        }
        modal.find('#challenge-hint').html(entries);
        modal.find('.modal-hint').show();
	    $('[data-toggle="tooltip"]').tooltip();
    }
    else {
        modal.find('#challenge-hint').html("");
        modal.find('.modal-hint').hide();
    }
    if ( challenge.solved_times == 0 )
        modal.find('#challenge-solved_times').text("Nobody solved yet.");
    else
        modal.find('#challenge-solved_times').text(challenge.solved_times + (challenge.solved_times == 1 ? " Team":" Teams") + " solved.");
    modal.find('#flag_input').val('');
    modal.find('#submit-status').text('');
    modal.find('#submit-status').hide();
    // save challenge id to button's data-href
    $('#flag_submit_button').data('href', chall_id);

    if ( challenge.solved ) {
        modal.find('#solved-message').html("Challenge already solved!");
        modal.find('#solved-message').show();
        modal.find('#submit-form').hide();
    } else {
        modal.find('#solved-message').hide();
        modal.find('#submit-form').show();
    }

    modal.modal('show');
    window.location.hash = "#" + chall_id;

    if (challenge.solved_times) {
        $.getJSON("/dashboard/solved_team_data_" + challenge.id, function(data) {
            if (data.length)  {
                var entries = '<table class="table table-condensed">';
                entries += '<thead><tr>';
                entries += '<th>#</th>';
                entries += '<th>Team</th>';
                entries += '<th>Submit Time</th>';
                entries += '</tr></thead>';
                entries += '<tbody>';
                var rank = 1;
                for (var i in data) {
                    var log = data[i];

                    entries += "<tr>";
                    entries += "<td>" + rank + "</td>";
                    entries += '<td><a href="/team/' + log.id + '">' + escape_html(log.name) + '</td>';
                    if (contest_end) {
                        entries += '<td>' + moment.utc(log.timestamp * 1000).format("YYYY-MM-DD HH:mm:ss UTC") + '</td>';
                    } else {
                        entries += '<td><span data-toggle="tooltip" data-placement="right" title="' + moment(log.timestamp * 1000).format("YYYY-MM-DD HH:mm:ss") + '">'
                            + moment(log.timestamp * 1000).fromNow() + "</span></td>";
                    }
                    entries += "</tr>";
                    rank += 1;
                }

                entries += '</tbody>';
                entries += '</table>';
                $("#challenge-solved-team").html(entries);
                modal.find('#challenge-solved-team').show();
            } 
            $('[data-toggle="tooltip"]').tooltip();
        });
    }
});


$('#btn-all').click(function() {
    if ($(this).hasClass("active"))
        return;
    var btn1 = $("#btn-all");
    var btn2 = $("#btn-unsolved");
    btn1.toggleClass('active btn-primary btn-default');
    btn2.toggleClass('active btn-primary btn-default');
    mode = "all";
    localStorage.setItem('challenge_mode', mode);
    update_dashboard_challenges();
});

$('#btn-unsolved').click(function() {
    if ($(this).hasClass("active"))
        return;
    var btn1 = $("#btn-all");
    var btn2 = $("#btn-unsolved");
    btn1.toggleClass('active btn-primary btn-default');
    btn2.toggleClass('active btn-primary btn-default');
    mode = "unsolved";
    localStorage.setItem('challenge_mode', mode);
    update_dashboard_challenges();
});

$('#challenge-modal').on('hidden.bs.modal', function () {
    history.pushState("", document.title, window.location.pathname + window.location.search);
})

