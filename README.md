Rangepicker for jQuery UI
=======================

About
-----
Rangepicker is a wrapper/extension to provide for range selection within jQuery UI's datepicker.



Usage
---

**To initialise:**

	$("#elem").rangepicker();




**Options**

	$("#elem").rangepicker({
		datepicker: {
			numberOfMonths: [3,4],
	  	},
		periodToggle: [false, false]
	});



**Accessing dates**

All dates are kept within the singleton class of $.rangepicker.

To access the collection of dates across the page:

	$.rangepicker.getCollection("elem");
	
where `elem` is the id of the element



Screenshot
---
![Screenshot](https://raw.github.com/yeojz/rangepicker-js/screenshots/screenshot.png)





Acknowledgements
---
Calendar Icon: "Icon made by Freepik from Flaticon.com"