var update_scoreboard = function(){
    $.getJSON("/dashboard/scoreboard_data", function(data) {
        var entries = "";
        var teamstat = data.teamstat;
        var challenges = data.challenges;

        var rank = 1
        var _mode = mode;

        // table head
        if ( _mode == "full" ) {
            thead_tr =  '<th style="width:50px;">Rank</th>'
            thead_tr += '<th style="width:160px;">Team</th>'
            thead_tr += '<th style="width:65px;">Country</th>'
            thead_tr += '<th style="width:65px;">Score</th>';
            thead_tr += '<th class="visible-xs">Solved</th>';

            for ( var c in challenges ) {
                chal = challenges[c];

                thead_tr += '<th class="flag show-on-hover hidden-xs"><span class="glyphicon glyphicon-flag"></span><div>' + escape_html(chal.name) +
                    " (" + chal.score + ")" + "<p>" + chal.solved_times + (chal.solved_times == 1 ? " solve":" solves") + "</p></div></th>";

                //thead_tr += '<th class="flag hidden-xs">';
                //thead_tr += '<span class="glyphicon glyphicon-flag" data-toggle="tooltip" data-placement="auto" title="' ;
                //thead_tr += escape_html(chal.name) + " (" + chal.score + "pts) / " + chal.solved_times + (chal.solved_times == 1 ? " solve":" solves");
                //thead_tr += '"></span></th>';
            }
        } else {
            thead_tr =  '<th>Rank</th>'
            thead_tr += '<th>Team</th>'
            thead_tr += '<th>Country</th>'
            thead_tr += '<th>Score</th>';
            thead_tr += '<th>Last Submit</th>';
        }

        // rows
        for ( var t in teamstat ) {
            team = teamstat[t];
            entries += '<tr class="entry" data-href="' + team.id +'">';
            entries += "<td>" + rank + "</td>";
            if (_mode == "full") {
                entries += "<td style='word-wrap:break-word;'><a class='team-url' href='/team/" + team.id + "'>"
                    + "<strong>" + escape_html(team.name) + "</strong></a></td>";
            } else {
                entries += "<td style='word-wrap:break-word;'><strong>" + escape_html(team.name) + "</strong></td>";
            }
            if ( team.flag_css ) {
                if ( _mode == "full" ) 
                    entries += "<td><i class='" + team.flag_css + "'></i></td>";
                else
                    entries += "<td><i class='" + team.flag_css + "'></i> &nbsp;<span class='hidden-xs'>" + team.country_name + "</span></td>";
            } else {
                entries += "<td>-</td>";
            }
            entries += "<td>" + team.score + "</td>";

            if ( _mode == "full" ) {
                entries += '<td class="visible-xs">' + team.solved_challenge.length + '</td>';

                // solved challenge
                for ( var c in challenges ) {
                    var chal = challenges[c];
                    var solved =  (team.solved_challenge.indexOf(chal.id) != -1);
                    var firstblood = (chal.first_solved_team == team.id);
                    var solved_time = 0.0;
                    if (solved) solved_time = (team.solved_challenge_time[team.solved_challenge.indexOf(chal.id)]);
                    
                    if ( firstblood )
                        entries += "<td class='hidden-xs firstblood show-on-hover'><div class='label label-danger'>FirstBlood - "+chal.name+" ("+moment.utc(solved_time*1000).format("YYYY-MM-DD HH:mm:ss UTC")+")</div></td>";
                    else if ( solved )
                        // entries += "<td class='hidden-xs solved'></td>";
                        entries += "<td class='hidden-xs solved show-on-hover'><div class='label label-success'>Solved - "+chal.name+" ("+moment.utc(solved_time*1000).format("YYYY-MM-DD HH:mm:ss UTC")+")</div></td>";
                    else
                        entries += "<td class='hidden-xs'></td>";
                }
            } else {
                if ( team.score == 0 ) {
                    entries += "<td>Never</td>";
                } else {
                    if (contest_end) {
                        entries += '<td>' + moment.utc(team.last_submit_time*1000).format("YYYY-MM-DD HH:mm:ss UTC") + '</td>';
                    } else {
                        entries += '<td><span data-toggle="tooltip" title="' + moment(team.last_submit_time*1000).format("YYYY-MM-DD HH:mm:ss") +  '">'
                            + moment(team.last_submit_time*1000).fromNow() + "</span></td>";
                    }
                }
            }
            entries += "</tr>";
            rank += 1;
        }

        if ( _mode == "full" )  {
            $("#content").removeClass("container");
            $("#scoreboard-table").html("<table class='table score-table-full'><thead>" + thead_tr + "</thead>" + entries + "</table>");
	} else {
            $("#content").addClass("container");
            $("#scoreboard-table").html("<table class='table table-striped table-hover score-table-simple'><thead>" + thead_tr + "</thead>" + entries + "</table>");
	}
        if (contest_end) {
            last_update_entries = moment.utc(data.last_update*1000).format("YYYY-MM-DD HH:mm:ss UTC");
        } else {
            last_update_entries = '<span data-toggle="tooltip" title="' + moment(data.last_update*1000).format("YYYY-MM-DD HH:mm:ss") +  '">'
                + moment(data.last_update*1000).fromNow() + "</span>";
        }
        $("#last-update").html("Last Update: " + last_update_entries);
        $('[data-toggle="tooltip"]').tooltip();
    });
};

var mode = localStorage.getItem('scoreboard_mode');
if (mode == null) {
    mode = "simple";
}

if (mode == "full") {
    var btn_active = $("#btn-full");
    var btn_disable = $("#btn-simple");
} else {
    var btn_active = $("#btn-simple");
    var btn_disable = $("#btn-full");
}

btn_active.addClass('active btn-primary');  
btn_active.removeClass('btn-default');  

btn_disable.removeClass('active btn-primary');  
btn_disable.addClass('btn-default');  

update_scoreboard();
setInterval(update_scoreboard, refresh_interval);;

$('#btn-full').click(function() {
    if ($(this).hasClass("active"))
        return;

    var btn1 = $("#btn-full");
    var btn2 = $("#btn-simple");
    btn1.toggleClass('active btn-primary btn-default');  
    btn2.toggleClass('active btn-primary btn-default');  
    mode = "full";
    localStorage.setItem('scoreboard_mode', mode);
    update_scoreboard();
});

$('#btn-simple').click(function() {
    if ($(this).hasClass("active"))
        return;
    var btn1 = $("#btn-full");
    var btn2 = $("#btn-simple");
    btn1.toggleClass('active btn-primary btn-default');  
    btn2.toggleClass('active btn-primary btn-default');  
    mode = "simple";
    localStorage.setItem('scoreboard_mode', mode);
    update_scoreboard();
});


function getSelectionText() {
    if (window.getSelection)
        return window.getSelection().toString();
    else if (document.selection && document.selection.type != "Control")
        return document.selection.createRange().text;
}

$(document).on('click', '.entry', function(){
    if (mode == "simple" && !getSelectionText())
        window.location = "/team/"+ $(this).data("href");
});

