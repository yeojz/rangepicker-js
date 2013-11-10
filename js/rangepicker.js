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
			dayNamesMin: [ "S", "M", "T", "W", "T", "F", "S" ],

			numberOfMonths: [1,2],
			
			inline: true,

			showOtherMonths: true,
	    	selectOtherMonths: true,
	    	selectMultiple: true,	


	    	numberOfPeriods: 2,
	    	periodLabels: ["Current Date Range", "Compare To"],

	    	saveControlLabels: ["Apply", "Cancel"],

	    	rangeCollection: {},
	    	tempRangeCollection: {},

		};

		this._classNames = {
			toggleBtnName : 'rp-display',
			wrapperName : 'rp',
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
			
			inst.calendarElem.datepicker({
   				inline: this.getSetting(inst, "inline"),
   				numberOfMonths: this.getSetting(inst, "numberOfMonths"),
   				showOtherMonths: this.getSetting(inst, "showOtherMonths"),
        		selectOtherMonths: this.getSetting(inst, "selectOtherMonths"),
        		selectMultiple: this.getSetting(inst, "selectMultiple"),

        		onSelect: this.rp_onSelect,
   				beforeShowDay: this.rp_beforeShowDay,

   				dayNamesMin: this.getSetting(inst, "dayNamesMin"),

   				rp_inst: inst,
   				rp_monthNames: this.getSetting(inst, "monthNames")
   				
   			});
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

					var name = self._classNames[elem+"Name"];

					$parent.append('<div class="'+name+'"></div>'); 
						inst[elem+"Elem"] = $("."+name);
				})
			});



			//	Geenerate Inputs and Buttons
			var dateControlContent  = "";
			var numberOfPeriods = self.getSetting(inst, "numberOfPeriods");
			
			var periodValues = {};

			for (var i = 0; i < numberOfPeriods; i++){

				var num = i+1;
				dateControlContent 	+= '<div class="period'+num+'-wrapper">'
					   				+ '<strong>'
					   				+ self.getSetting(inst, "periodLabels")[i]
					   				+'</strong>'
					   				+ '<input type="text" class="period-inputs period'+num+'" data-rangeid="'+num+'" />'
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
	    	var date_infocus = $.datepicker.formatDate('yymmdd', date);

	    	var rootId = $(this).parents(".rp").parent().attr("id");
	    	var collection = $.rangepicker.getTempCollection(rootId)

	    	;
	    	var state = true;
	    	var resultant_class = "";

	    	$.each(collection, function(key, value){
		    		if (date_infocus == value[0] || date_infocus == value[1]){
	    				resultant_class += key+"-day ";
			    		resultant_class += key+"-mark ";
			    	
			    } else if (date_infocus > value[0]  && date_infocus < value[1] ){
			    		resultant_class += key+"-day ";
			    }

	    	});
			return [true, resultant_class];
		},


		rp_resetInputs: function(inst){
			var periodValues = this.getCollection(inst.id);

			var monthNames = this.getSetting(inst, "monthNames");
			var numberOfPeriods = this.getSetting(inst, "numberOfPeriods");

			for (var i = 1; i <= numberOfPeriods; i++){

				var period = periodValues["period"+i];

				if (period[0] == "" && period[1] == ""){
					inst.dateControlElem.find(".period"+i).val("");
					continue;
				}

				var dateFrom = monthNames[period[0].substring(4, 6)-1] + " " + period[0].substring(6,8);
				var dateTo	= monthNames[period[1].substring(4, 6)-1] + " " + period[1].substring(6,8) + ", " + period[1].substring(0, 4);

				inst.dateControlElem.find(".period"+i).val(dateFrom + " - " + dateTo)
			}
		},


		//	Interactions
		saveState: function(inst){
			$.rangepicker._setCollection(
				inst.id, 
				$.extend(true, {}, this.getSetting(inst, "tempRangeCollection")[inst.id])
				);

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
				$.extend(true, {}, this.getSetting(inst, "rangeCollection")[inst.id])
				);

			this.rp_resetInputs(inst);
		},



		_addInteractions: function(inst){
			
			var self = this;

			inst.rootElem.css({
		    	"position": "relative",
		    });
		    inst.wrapperElem.css({
		    	"top": inst.toggleBtnElem.height()+10 + "px"
		    });

		    inst.dateControlElem.find(".period-inputs").on("click", function(){
		    	inst.dateControlElem.find(".period-inputs").removeClass("focus");
		    	$(this).addClass("focus");

		    });


		    inst.saveControlElem.find(".btn-apply").on("click", function(){
		    	self.saveState(inst);
		    	inst.wrapperElem.fadeOut();

		    })

		    inst.saveControlElem.find(".btn-cancel").on("click", function(){
		    	self.discardState(inst);
		    	inst.wrapperElem.fadeOut();

		    })

		    inst.toggleBtnElem.on("click", function(){
		    	self.discardState(inst);

		    	inst.dateControlElem.find(".period-inputs")[0].click();
		    	self._renderCalendar(inst);

		    	inst.wrapperElem.fadeToggle();

		    })


		},





	});


	$.fn.rangepicker = function(options){
		return $.rangepicker._init(this, options);		
	}


	$.rangepicker = new Rangepicker();
	$.rangepicker.uuid = new Date().getTime();
	$.rangepicker.version = "0.0.1";

})(jQuery);