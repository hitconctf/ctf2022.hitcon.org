function trend_generate_graph(data) {
	data.scores.sort(function(a, b) {
		if ( b.score == a.score )
			return a.last_submit_time - b.last_submit_time;
		return b.score - a.score;  
	});
	// Options
	var options = {
		series: {
			lines: { show: true , steps:true},
			points: { show: true }
		},
		xaxis: {
			tickFormatter: function (val, axis) {
				val = Math.round(val / 1000 / 60);
				h = Math.floor(val / 60).toString()
				m = val % 60
				if (m < 10) {
					m = "0" + m.toString()
				} else {
					m = m.toString()
				}
				return h + ":" + m
			}
		},
		grid: {
			hoverable: true,
			clickable: true,
			autoHighlight: true
		},
		legend:{
			position: "nw",
			labelFormatter: function (label, series) {
				return escape_html(label) + ': ' + series.score;
			}
		}
	};

	if (trend_graph_hair) {
		options['crosshair'] = {
			mode: "x"
		}
	}
	if (data == undefined) {
		data = trend_graph_data;
	} else {
		trend_graph_data = data;
	}

	// Display last update time
	$("#last_update").html("Last Update: " + data['time']);

	// Generate the graph
	trend_plot = $.plot("#trend", data['scores'], options);

	// Interactive events
	var div_trend = $("#trend");
	// var trend_container = $("#trend_container");
	var trend_last_timeout = null;
	var trend_last_position = null;

	function trend_update_legends (pos) {
		if (!trend_graph_hair) {
			return;
		}

		trend_last_timeout = null;
		// var pos = trend_last_position; // BUG
		var axes = trend_plot.getAxes();
		if (pos.x < axes.xaxis.min ||
			pos.x > axes.xaxis.max ||
			pos.y < axes.yaxis.min ||
			pos.y > axes.yaxis.max) {
			return;
		}

		var data = trend_plot.getData();
		for (var i = 0; i < data.length; i++) {
			var team = data[i];
			for (var j = 0; j < team.data.length; j++) {
				if (team.data[j][0] > pos.x) {
					break;
				}
			}

			if(team.data.length == 0)
				continue;

			var score;
			var score_left = team.data[j - 1];
			var score_right = team.data[j];


			if (score_left == null) {
				score = score_right[1];
			} else if (score_right == null) {
				score = score_left[1];
			} else {
				score = score_left[1];
			}

			$('#trend .legendLabel').eq(i).text(team.label + ": " + score);
		}
	}

	div_trend.bind("plothover", function (event, pos, item) {
		if (item) {
			var team = item.series.label;
			var score = item.datapoint[1];
			//var problem = item.series.data[item.dataIndex][2];
			var html = escape_html(team) + ": " + score;
			//if (problem != undefined) {
			//	html += "<br>submit " + escape_html(problem);
			//}
			$("#trend_tooltip").html(html)
				.css({top: item.pageY + 15, left: item.pageX + 15})
				.fadeIn(200);
		} else {
			$("#trend_tooltip").hide();
		}

		div_trend_last_position = pos;
		if (!trend_last_timeout) {
			trend_last_timeout = setTimeout(function() {trend_update_legends(pos)}, 50);
		}
	});

}

// periodically update trend graph
function trend_periodically_update_graph () {
	$.ajax({
		type: 'GET',
		url: '/dashboard/trend_data',
		dataType: 'json',
		success: trend_generate_graph
	});
}

trend_periodically_update_graph();
setInterval(trend_periodically_update_graph, refresh_interval);

trend_graph_hair = true;
trend_graph_data = undefined;
$("#trend").click(function () {
	trend_graph_hair = !trend_graph_hair;
	trend_generate_graph();
});
