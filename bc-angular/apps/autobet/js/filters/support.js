'use strict';

Application.Filters.filter('priority', function() {
	return function(input) {
		var string = '';
		switch (parseInt(input)) {
			case 1:
				string = 'Low';
				break;
			case 2:
				string = 'Normal';
				break;
			case 3:
				string = 'High';
				break;
			case 4:
				string = 'Urgent';
				break;
		}
		return string;
	};
});

Application.Filters.filter('type', function() {
	return function(input) {
		var string = '';
		switch (parseInt(input)) {
			case 1:
				string = 'Incident';
				break;
			case 2:
				string = 'Question';
				break;
			case 3:
				string = 'Problem';
				break;
			case 4:
				string = 'Task';
				break;
		}
		return string;
	};
});

Application.Filters.filter('user', function() {
	return function(input) {
		var string = '';
		if (input) {
			string = "Admin";
		} else {
			string = "User";
		}
		return string;
	};
});
// open = 1, closed = 2, pending = 3,  flagged = 4
Application.Filters.filter('status', function() {
	return function(input) {
		var string = '';
		switch (parseInt(input)) {
			case 1:
				string = 'Open';
				break;
			case 2:
				string = 'Closed';
				break;
			case 3:
				string = 'Pending';
				break;
			case 4:
				string = 'Flagged';
				break;
		}
		return string;
	};
});