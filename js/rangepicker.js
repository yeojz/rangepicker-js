/*
 * jQuery Rangepicker Extension
 * By: Gerald Yeo [http://fusedthought.com]
 *
 * Copyright 2013 Gerald yeo
 * You may use this project under MIT license.
 */

(function($){

$.extend($.ui, {
	Rangepicker: { version: "0.0.1" } 
});


function Rangepicker(){


	this._defaults = {
		monthNames: [
	   				"Jan",
	   				"Feb",
	   				"Mar",
	   				"Apr",
	   				"May",
	   				"Jun",
	   				"Jul",
	   				"Aug",
	   				"Sep",
	   				"Oct",
	   				"Nov",
	   				"Dec"
	   			],

		datepicker: {		   			
			dayNamesMin: [ "S", "M", "T", "W", "T", "F", "S" ],
			numberOfMonths: [1,2],
			inline: true,
			showOtherMonths: true,
	    	selectOtherMonths: true,
	    	selectMultiple: true,	
	    },

    	numberOfPeriods: 2,
    	periodLabels: ["Current Date Range", "Compare To"],
    	periodToggle: [false, true],

    	saveControlLabels: ["Apply", "Cancel"],

    	rangeCollection: {},
    	tempRangeCollection: {},

    	toggleSave: false,


    	plugin: function(inst){}
	};

	this._classNames = {
		rootName: 'rp',
		toggleBtnName : 'rp-display',
		wrapperName : 'rp-popup',
		calendarName : 'rp-calendar',
		dateControlName : 'rp-datecontrol',
		saveControlName : 'rp-savecontrol',
	}


}








$.extend(Rangepicker.prototype, {


	// Initializations
	_init: function(target, settings){

		if (!target.id) {
			this.uuid += 1;
			target.id = "rp" + this.uuid;
		}

		inst = this._newInstance($(target));
		inst.settings = $.extend({}, settings || {});

		this._generateElements(inst);
		this._renderCalendar(inst);
		this._addInteractions(inst);

		this._addons(inst);

	},







	_newInstance: function(target){
		var id = target[0].id.replace(/([^A-Za-z0-9_\-])/g, "\\\\$1");

		return {
			id : id,

			rootElem: target,
			toggleBtnElem: null,

			wrapperElem: null,
			calendarElem: null,
			dateControlElem: null,
			saveControlElem: null,

			periodInputElem: [],
		}
	},







	getSetting: function(inst, name){
		if (name == "all"){
			return inst.settings;
		}

		return (inst.settings[name] !== undefined) ?
			inst.settings[name] : this._defaults[name];
	},
	getGlobal: function(name){
		return (typeof this._defaults[name] == 'undefined') ? null : this._defaults[name];
	},
	getClassName: function(name){
		return (typeof this._classNames[name] == 'undefined') ? null : this._classNames[name];
	},

	getCollection: function(id){
		return $.rangepicker._defaults.rangeCollection[id]
	},
	getTempCollection: function(id){
		return $.rangepicker._defaults.tempRangeCollection[id]
	},







	_setCollection: function(id, value){
		$.rangepicker._defaults.rangeCollection[id] = value;
	},
	_setCollectionValue: function(id, name, value){
		$.rangepicker._defaults.rangeCollection[id][name] = value;
	},

	_setTempCollection: function(id, value){
		$.rangepicker._defaults.tempRangeCollection[id] = value;
	},
	_setTempCollectionValue: function(id, name, value){
		$.rangepicker._defaults.tempRangeCollection[id][name] = value;
	},






	// Renderings
	_renderCalendar: function(inst){
		
		var options = $.extend(true, {
			onSelect: this.rp_onSelect,
				beforeShowDay: this.rp_beforeShowDay,
				rp_inst: inst,
				rp_monthNames: this.getSetting(inst, "monthNames")
			},
			this.getSetting(inst, "datepicker")
		)


		inst.calendarElem.datepicker(options);
	},


	_reloadCalendar: function(inst){
		inst.calendarElem.datepicker("refresh");
	},




	_generateElements: function(inst){
		var self = this;


		//	Generate the main elements
		var generateArray = {
			root : ["toggleBtn", "wrapper"],
			wrapper : ["dateControl", "calendar", "saveControl"]
		};
		
		$.each(generateArray, function(key, list){
			$parent = inst[key+"Elem"];

			$.each(list, function(i, elem){

				var name = self.getClassName(elem+"Name");

				$parent.append('<div class="'+name+'"></div>'); 
					inst[elem+"Elem"] = $parent.find("."+name);
			})
		});



		//	Geenerate Inputs and Buttons
		var dateControlContent  = "";
		var numberOfPeriods = self.getSetting(inst, "numberOfPeriods");
		var periodToggle = self.getSetting(inst, "periodToggle");

		var periodValues = {};

		for (var i = 0; i < numberOfPeriods; i++){

			var num = i+1;


			toggleInput = (periodToggle[i]) ? '<input type="checkbox" class="period-toggle period'+num+'-toggle" />' : '';
			disableInput = (periodToggle[i]) ? 'disabled="disabled"' : '';
			


			dateControlContent 	+= '<div class="period-inputs-wrapper period'+num+'inputs-wrapper">'
								+ '<div class="period-inputs-title">'
								+ toggleInput
				   				+ '<strong>'
				   				+ self.getSetting(inst, "periodLabels")[i]
				   				+'</strong>'
				   				+ '</div>'
				   				+ '<input type="text" class="period-inputs period'+num+'" data-rangeid="'+num+'" '+disableInput+' />'
				   				+ '</div>';

			periodValues["period"+num] = ["", ""];

		}

		this._setCollection(
			inst.id, 
			$.extend(true, {}, periodValues)
			);
		this._setTempCollection(
			inst.id, 
			$.extend(true, {}, periodValues)
			);
	
		dateControlContent += '<div class="rp-clear"></div>'
		inst.dateControlElem.append(dateControlContent);										


		saveControlContent	= '<button class="btn-apply">'
							+ self.getSetting(inst, "saveControlLabels")[0]
							+ '</button>'
							+ '<button class="btn-cancel">'
							+ self.getSetting(inst, "saveControlLabels")[1]
							+ '</button>';	

		inst.saveControlElem.append(saveControlContent);
		


		//	Add defaults
		inst.toggleBtnElem.html("Select Date Range");

		inst.rootElem.addClass(this.getClassName("rootName"));

		var numberOfMonths = this.getSetting(inst, "datepicker").numberOfMonths;

		if ( $.isArray(numberOfMonths) ){
			inst.rootElem.attr("data-rpformat", numberOfMonths[0]+"-"+numberOfMonths[1]);
		} else {
			inst.rootElem.attr("data-rpformat", numberOfMonths);
		}

	},








	//	RP behaviours
	rp_onSelect: function(dateText, dp_inst) {
		var inst = dp_inst.settings.rp_inst; 
		var monthNames = dp_inst.settings.rp_monthNames;

		var periodId = inst.dateControlElem.find(".period-inputs.focus").attr("data-rangeid");
		var period = $.rangepicker.getTempCollection(inst.id)["period"+periodId];

   		var currentDay = $.datepicker.formatDate('yymmdd', new Date(dp_inst.selectedYear, dp_inst.selectedMonth, dp_inst.selectedDay));
   	
   		var d1 = period[0],
   			d2 = period[1];

		if ( !d1 ){
			d1 = currentDay;
			d2 = currentDay;
			

		} else if (d1 == d2){
			if (currentDay < d1){
				d1 = currentDay;	
			}	
			d2 = currentDay;	

		} else if (d1 != d2){
			d1 = currentDay;
			d2 = currentDay;	

		}

		var dateFrom = monthNames[d1.substring(4, 6)-1] + " " + d1.substring(6,8);
   		var dateTo	= monthNames[d2.substring(4, 6)-1] + " " + d2.substring(6,8) + ", " + d2.substring(0, 4);

   		inst.dateControlElem.find(".period-inputs.focus").val(dateFrom + " - " + dateTo);


   		$.rangepicker._setTempCollectionValue(inst.id, "period"+periodId, [d1, d2]);


	},







	rp_beforeShowDay: function(date){
    	var infocus = $.datepicker.formatDate('yymmdd', date);

    	var popup = $.rangepicker.getClassName("wrapperName");

    	var rootId = $(this).parents("."+popup).parent().attr("id");
    	var collection = $.rangepicker.getTempCollection(rootId);

    	var state = true;
    	var resultantSet= [];
    	var resultantClass = "";

    	$.each(collection, function(key, value){
	    		if (infocus == value[0] || infocus == value[1]){
    				resultantSet.push(key+"-day");
		    		resultantClass += key+"-mark ";
		    	
		    } else if (infocus > value[0]  && infocus < value[1] ){
		    		resultantSet.push(key+"-day");
		    }

    	});

    	if (resultantSet.length > 1){
    		resultantClass += "overlap-day ";
    	};

    	resultantClass += resultantSet.join(" ");
		return [true, resultantClass];
	},







	rp_resetInputs: function(inst){
		var db = this.getCollection(inst.id);

		var monthNames = this.getSetting(inst, "monthNames");
		var numberOfPeriods = this.getSetting(inst, "numberOfPeriods");

		for (var i = 1; i <= numberOfPeriods; i++){

			var period = db["period"+i];

			if (period[0] == "" && period[1] == ""){
				inst.dateControlElem.find(".period"+i).val("");
				inst.dateControlElem.find(".period"+i+"-toggle").removeAttr("checked");

				continue;
			}

			var dateFrom = monthNames[period[0].substring(4, 6)-1] + " " + period[0].substring(6,8);
			var dateTo	= monthNames[period[1].substring(4, 6)-1] + " " + period[1].substring(6,8) + ", " + period[1].substring(0, 4);

			inst.dateControlElem.find(".period"+i).val(dateFrom + " - " + dateTo)
		};
	},






	_resetCollections: function(inst){
		var tempCollection = this.getTempCollection(inst.id);
		var numberOfPeriods = this.getSetting(inst, "numberOfPeriods");

		$.each(this.getSetting(inst, "periodToggle"), function(idx, value){
			if (value){
				num = idx+1;
				if(!inst.rootElem.find(".period"+num+"-toggle").is(":checked")){
					tempCollection["period"+num] = ["", ""];
				}
			}
			
		});
	},







	//	Interactions
	saveState: function(inst){

		this._resetCollections(inst);

		//save all
		$.rangepicker._setCollection(
			inst.id, 
			$.extend(true, {}, this.getTempCollection(inst.id))
			);


		//add to button display.
		var period = this.getCollection(inst.id)["period1"];


		var monthNames = this.getSetting(inst, "monthNames");
		var dateFrom = monthNames[period[0].substring(4, 6)-1] + " " + period[0].substring(6,8);
		var dateTo	= monthNames[period[1].substring(4, 6)-1] + " " + period[1].substring(6,8) + ", " + period[1].substring(0, 4);


		inst.toggleBtnElem.html(dateFrom + " - " + dateTo);
	},







	discardState: function(inst){
		inst.calendarElem.datepicker("destroy");

		$.rangepicker._setTempCollection(
			inst.id,
			$.extend(true, {}, this.getCollection(inst.id))
			);

		this.rp_resetInputs(inst);
	},






	_addInteractions: function(inst){
		
		var self = this;

		inst.rootElem.css({
	    	"position": "relative",
	    });

	    inst.wrapperElem.css({
	    	top: inst.toggleBtnElem.height() + inst.toggleBtnElem[0].offsetTop + 10+ "px",
	    	left: inst.toggleBtnElem[0].offsetLeft + "px",
	    });




	    inst.dateControlElem.find(".period-toggle").on("change", function(){

	    	var currentInput = $(this).parents(".period-inputs-wrapper").find(".period-inputs");

	    	if ($(this).is(':checked')){
	    		currentInput.removeAttr("disabled").click();
	    	} else {
	    		currentInput.attr("disabled", "disabled");
	    		inst.dateControlElem.find(".period-inputs")[0].click();
	    		
	    		currentInput.val("");

	    		var tempCollection = self.getTempCollection(inst.id);
	    		tempCollection["period"+currentInput.attr("data-rangeid")] = ["", ""];
	    		self._reloadCalendar(inst);
	    		
	    	}
	    });



	    inst.dateControlElem.find(".period-inputs").on("click", function(){
	    	inst.dateControlElem.find(".period-inputs").removeClass("focus");
	    	$(this).addClass("focus");
	    });


	    inst.dateControlElem.find(".period-inputs").on("focus", function(){

	    })








	    inst.saveControlElem.find(".btn-apply").on("click", function(){
	    	self.saveState(inst);
	    	inst.wrapperElem.fadeOut();

	    });

	    inst.saveControlElem.find(".btn-cancel").on("click", function(){
	    	self.discardState(inst);
	    	inst.wrapperElem.fadeOut();

	    });


	    inst.toggleBtnElem.on("click", function(){

	    	if(self.getSetting(inst, "toggleSave")){
	    		self.saveState(inst);
	    	} else {
	    		self.discardState(inst);
	    	}

	    	inst.dateControlElem.find(".period-inputs")[0].click();
	    	self._renderCalendar(inst);

	    	inst.wrapperElem.fadeToggle();

	    });

	},






	_addons: function(inst){
		this.getSetting(inst, "plugin")(inst);
	},


});


$.fn.rangepicker = function(options){
	return $.rangepicker._init(this, options);		
}


$.rangepicker = new Rangepicker();
$.rangepicker.uuid = new Date().getTime();
$.rangepicker.version = $.ui.Rangepicker.version;

})(jQuery);