function escape_html(str) {
    return document.createElement('span')
        .appendChild(document.createTextNode(str))
        .parentNode.innerHTML;
}

// nav timer handling script
var contest_begin_time = parseInt($("#contest_start_time").val(), 10);
var contest_end_time = parseInt($("#contest_end_time").val(), 10);
//var contest_current_time = parseInt($("#current_time").val(), 10);
var contest_current_time = parseInt(Math.floor(Date.now() / 1000), 10);

function update_nav_timer()
{
    function pad(num)
    {
        return (num < 10 ? "0" + num : num);
    }

    function to_time_string(offset)
    {
	var days = Math.floor(offset/24/60/60);
	var hoursleft = Math.floor((offset - (days*86400)) / 3600);
	if (days == 0)
	  return hoursleft + ":" + pad(Math.floor((offset % 3600) / 60)) + ":" + pad(Math.floor(offset % 60));
	else
	  return days + " days " + hoursleft + ":" + pad(Math.floor((offset % 3600) / 60)) + ":" + pad(Math.floor(offset % 60));
    }

    if ( contest_current_time == contest_begin_time ) {
        location.reload();
        return;
    }

    if (contest_current_time < contest_begin_time) {
        $("#timer").text("Contest begins in: " + to_time_string(contest_begin_time - contest_current_time));
    } else if (contest_current_time >= contest_end_time) {
        $("#timer").text("Contest is over");
    } else {
        $("#timer").text("Countdown: " + to_time_string(contest_end_time - contest_current_time));
    }
    contest_current_time += 1;
}

update_nav_timer();
setInterval("update_nav_timer()", 1000);
