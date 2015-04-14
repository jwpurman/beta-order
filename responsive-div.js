// ***this goes on the global scope
// get querystring as an array split on "&"
var querystring = location.search.replace('?', '').split('&');
// declare object
var queryObj = {};
// loop through each name-value pair and populate object
for (var i = 0; i < querystring.length; i++) {
	// get name and value
	var name = querystring[i].split('=')[0];
	var value = querystring[i].split('=')[1];
	// populate object
	queryObj[name] = value;
}

var _accountid, _authkey, _leadid, _templeadid, _sessionid, _serverurl, _quoteid;
var _overrideproducts = [];
var _orderresponse;

var _updatinglead = false;
var _isexistingordertype = false;
var _isinternational = false;
var _isdelaware = true;
var _key = "0-0";
var _subtotal = 0;
var _countries = [];
var _products = [];
var _qualificationproductid = "01t80000003QCvLAAW";
var _additionalseriesproductid = "01t80000003QCufAAG";
var _additionalstockholderproductid = "01t80000003QoerAAC";
var _wirefeeproductid = "01t80000003QCyTAAW";
var _extraProducts = false;
var _gimmebreak = false;

function formatMoney(n) { var c = 2, d = ".", t = ",", s = n < 0 ? "-" : "", i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", j = (j = i.length) > 3 ? j % 3 : 0; return "$" + s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "") }
function formatDollars(n) { var c = 0, d = ".", t = ",", s = n < 0 ? "-" : "", i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", j = (j = i.length) > 3 ? j % 3 : 0; return "$" + s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "") }

function mapEntityType(p_MyType) {
	switch (p_MyType) {
		case 'LLC':
			return 'LLC';
		case 'SERIES':
			return 'SeriesLLC';
		case 'CORP':
			return 'Corporation';
		case 'LP':
			return 'LP';
		case 'NP':
			return 'NonProfitCorporation';
		default:
			return '';
	}
}
function apiType(types, value) {
	if (value == null) return null;

	var valueisstring = (typeof value == "string");

	var arr = $.grep(_staticdata[types], function (item, i) {
		var match = false;

		if (!match && item.id != null) {
			match = (item.id == value);
		}
		if (!match && item.key) {
			match = valueisstring ? (item.key.toUpperCase() == value.toUpperCase()) : (item.key == value);
		}
		if (!match && item.label) {
			match = valueisstring ? (item.label.toUpperCase() == value.toUpperCase()) : (item.label == value);
		}
		if (!match && item.name) {
			match = valueisstring ? (item.name.toUpperCase() == value.toUpperCase()) : (item.name == value);
		}

		return match;
		//return typeof value == "string" ? (item.id == value || item.key == value.toUpperCase() || item.label == value || item.name == value) : (false);
	});


	if (arr.length) return arr[0];
	else return null;
}

function cleanMoney(txt) {
	var m = parseFloat(txt.replace(/[^0-9.]/g, ""));
	if (isNaN(m)) c = 0;
	return formatMoney(m);
}
function getProductIds() {
	var arrProductIds = [];
	var arrInvisibles = [];

	$.each(_products, function (pi, pitem) {
		if (getUnitPrice(pitem.id, _key) > 0 && (_extraProducts || !pitem.inOfficeOnly)) arrProductIds.push(pitem.id);
		if (!_extraProducts && pitem.inOfficeOnly) arrInvisibles.push(pitem.id);
	});

	return [arrProductIds, arrInvisibles];
}
function getUnitPrice(productid, key) {
	var up = 0;
	var pArr = $.grep(_products, function (item, i) { return item.id == productid; });
	if (!pArr.length) return up;
	var p = pArr[0];

	var sid = key.split("-")[0];
	var eid = key.split("-")[1];

	var op = $.grep(_overrideproducts, function (item, i) { return item.product.id == p.id; });

	if (op.length) {
		up = op[0].unitPrice;
	}
	else {
		$.each(p.fees, function (fi, fitem) {
			var sitem = apiType("stateTypes", fitem.stateType);
			var eitem = apiType("entityTypes", fitem.entityType);

			if ((sitem == null || sitem.id == sid) && (eitem == null || eitem.id == eid)) {
				up += fitem.amount;
			}
		});
	}

	return up;
}
function getFeeStateIds(fees) {
	var arrStateIds = [];

	$.each(fees, function (fi, fitem) {
		var e = apiType("stateTypes", fitem.entityType);
		var eid = (e) ? e.id : _key.split("-")[1];
		if (eid == _key.split("-")[1]) {
			var s = apiType("stateTypes", fitem.stateType);
			if (s) {
				if ($.inArray(s.id, arrStateIds) == -1) arrStateIds.push(s.id);
			}
		}
	});

	return arrStateIds;
}
function getDistinctNames() {
	var arr = [];
	var nam = "";

	//order contact
	nam = $("#company_order_contact_firstName").val() + " " + $("#company_order_contact_lastName").val();
	if (nam.replace(/ /g, "") != "") if ($.inArray(nam, arr) == -1) arr.push(nam);

	//future contact
	nam = $("#company_future_contact_firstName").val() + " " + $("#company_future_contact_lastName").val();
	if (nam.replace(/ /g, "") != "") if ($.inArray(nam, arr) == -1) arr.push(nam);

	//parties
	$(".company_title_wrapper [data-name]:not(:focus, [data-noautocomplete])").each(function (i, item) {
		nam = $(item).val();
		if (nam.replace(/ /g, "") != "") if ($.inArray(nam, arr) == -1) arr.push(nam);
	});

	return arr;
}
function getAdditionalSeriesCount() {
	var included = 2;
	var total = 0;
	$(".company_title_wrapper div[data-titletype='4']").each(function (i, item) { if ($(item).find("[data-name]").val() != "") total++; });
	return (total > included) ? (total - included) : 0;
}
function getAdditionalStockholderCount() {
	var included = 3;
	var total = 0;
	$(".company_title_wrapper div[data-titletype='3']").each(function (i, item) { if ($(item).find("[data-name]").val() != "") total++; });
	return (total > included) ? (total - included) : 0;
}
function getName(ci) {
	var n = "";

	if (ci.salutationType) n = apiType("salutationTypes", ci.salutationType).label + " ";

	if (ci.firstName == "") n += ci.lastName;
	else n += (ci.firstName + " " + ci.lastName);

	return n;
}
function getContactInfoReviewHtml(ci) {
	return getName(ci) + " - " + ci.phone + " - " + ci.email + "<br/>" + ci.streetAddress + ", " + ci.city + ", " + ci.state + " " + ci.postal + ", " + ci.country
}
function updateUnitPricePackage($input) {
	var pid = $input.data("productid");
	var key = _key;

	var up = getUnitPrice(pid, key);
	$input.data("unitprice", up);
	//$tr.find(".unitpricetext").text(formatMoney(up));
}
function updateUnitPrice($li) {
	var pid = $li.data("productid");
	//skm track down later
	//var key = (pid == _qualificationproductid) ? (apiType("stateTypes", $li.closest("ul").find("div[data-detailsforproductid='" + $li.data("productid") + "'] label[data-detailtype='qualificationstate'] select").val()).id + "-" + _key.split("-")[1]) : _key;
	var key = _key;

	var up = getUnitPrice(pid, key);
	$li.data("unitprice", up);
	$li.find(".unitpricetext").text(formatMoney(up));
}
function updateIsDelaware() {
	var $tb = $("#company_future_contact_state").is(":enabled") ? $("#company_future_contact_state") : $("#company_order_contact_state");
	_isdelaware = $tb.val() == "DE";
}
function updateCompanyNameEnding($tb) {
	var cname = $tb.val();
	if (cname == "") return;

	//get state
	var e = apiType("entityTypes", _key.split("-")[1]);
	if (!e) return;

	//does name end with valid ending?
	var validending = false;
	$.each(e.endings, function (i, item) { if (cname.toUpperCase().indexOf(item.toUpperCase(), cname.length - item.length) != -1) { validending = true; return false; } });


	if (!validending) {
		$tb.val(cname + " " + e.endings[0]);
	}
}
function initNameAutocomplete($tb) {
	if (!$tb.is("[data-noautocomplete]")) $tb.autocomplete({ autoFocus: true, delay: 0, minLength: 0, source: function (req, res) { res($.grep(getDistinctNames(), function (item, i) { return req.term == "" || item.toUpperCase().indexOf(req.term.toUpperCase()) > -1; })); } });
}
function initCustomNameCheckboxUpdate($tb) {
	$tb.on("keyup change", function () {
		var blank = $(this).val() == "";
		$(this).closest("div").find(":checkbox:first").prop("checked", !blank).trigger("change");
	});
}
function initProductControlUpdate($ctrl) {
	$ctrl.on("change", function (event, ui) {
		//change event isn't fired on radio deselect
		if ($(this).is(":radio")) {
			var rname = $(this).attr("name");

			//					$(this).closest(".tab_content").find(":radio:not(:checked)[name='" + rname + "']").each(function (i, item) {
			//						var pid = $(item).closest("[data-productid]").data("productid");
			//						$(item).closest(".tab_content").find("[data-detailsforproductid='" + pid + "']").hide();
			//						$(item).closest("tr").data("quantity", 0).removeClass("ui-state-highlight");
			//					});
			$(this).closest(".sectioncontent").find(":radio:not(:checked)[name='" + rname + "']").each(function (i, item) {
				var pid = $(item).closest("[data-productid]").data("productid");
				$(item).closest(".sectioncontent").find("[data-detailsforproductid='" + pid + "']").hide();
				$(item).closest("div").data("quantity", 0).removeClass("ui-state-highlight");
			});
		}

		var pid = $(this).closest("[data-productid]").data("productid");
		var selected = $(this).is("select") ? $(this).val() > 0 : $(this).prop("checked");
		//it it's selected AND custom price AND clicked by a human (not triggered by code)...
		if (selected && $(this).closest("[data-productid]").is("[data-customprice]") && event.originalEvent) {
			var p = $.grep(_products, function (item, i) { return item.id == pid; })[0];
			var defaultprice = getUnitPrice(pid, _key);

			var pricetext = prompt("Please enter amount for '" + p.name + "':", formatMoney(defaultprice));
			var cleanprice = pricetext ? parseFloat(cleanMoney(pricetext).replace(/[^0-9.]/g, "")) : 0;
			if (cleanprice) {
				var overrideindex = -1;
				$.each(_overrideproducts, function (i, item) { if (item.product.id == p.id) { overrideindex = i; return false; } });
				if (overrideindex > -1) {
					_overrideproducts[overrideindex].unitPrice = cleanprice;
				}
				else {
					var op = {};
					op.unitPrice = cleanprice;
					op.quantity = 1;
					op.product = p;
					_overrideproducts.push(op);
				}
				$(this).closest("[data-productid]").data("unitprice", cleanprice);
				$(this).closest("[data-productid]").find(".unitpricetext").text(formatMoney(cleanprice));
			}
			else {
				if ($(this).is("select")) $(this).val(0); else $(this).prop("checked", false);
				selected = false;
			}

		}

		$(this).closest("div").toggleClass("ui-state-highlight", selected);

		//				$(this).closest(".tab_content").find("[data-detailsforproductid='" + pid + "']").each(function (i, item) {
		//					var $element = $(item);
		//					var showdetail = (selected && $element.is("[data-stateentitytypes]")) ? ($.inArray(_key, $element.data("stateentitytypes")) > -1) : selected;
		//					$element.toggle(showdetail).find(":input").prop("disabled", !showdetail);
		//				});
		$(this).closest(".sectioncontent").find("[data-detailsforproductid='" + pid + "']").each(function (i, item) {
			var $element = $(item);
			var showdetail = (selected && $element.is("[data-stateentitytypes]")) ? ($.inArray(_key, $element.data("stateentitytypes")) > -1) : selected;
			$element.toggle(showdetail).find(":input").prop("disabled", !showdetail);
		});

		//display quantity
		var quantity = selected ? $(this).is("select") ? $(this).val() : 1 : 0;
		$(this).closest("[data-productid]").data("quantity", quantity);
		$(this).closest("div").find(".productprice .quantitytext").text(((quantity > 1) ? (quantity + "x ") : ""));

		setSummary();
	}).trigger("change");
}
function initCountriesAndStates() {

	$("#company_order_contact_state_select, #company_future_contact_state_select, #company_partner_state_select").on("change", function () {
		var stateName = $(this).val();
		var stateTextName = $(this).attr("id").replace("_select", "");
		var stateText = $("#" + stateTextName);
		stateText.val(stateName).trigger("change");
	});

	$.ajax({
		type: "GET",
		url: _baseapiurl + "/dataset/country",
		cache: true,
		success: function (msg) {
			_countries = msg;

			//create selects
			var $all = $("<select>");
			var $apostille = $("<select>");
			$apostille.append($("<option>").val("").text("Choose One..."));
			$.each(_countries, function (i, item) {
				$all.append($("<option>").val(item.name).text(item.name));
				if (item.isHagueMember) $apostille.append($("<option>").val(item.name).text(item.name));
			});

			//contact, future, and partner
			$("#company_order_contact_country, #company_future_contact_country, #company_partner_country").html($all.html()).on("change", function () {
				var countryName = $(this).val();
				var stateSelectName = $(this).attr("id").replace("country", "state");
				var stateSelect = $("#" + stateSelectName + "_select");
				var stateText = $("#" + stateSelectName);

				var c = $.grep(_countries, function (item, i) { return item.name == countryName })[0];

				if (c.states.length) {
					var ss = $("<select>");
					ss.append($("<option>").val("").text("Choose One..."));
					$.each(c.states, function (i, item) { ss.append($("<option>").val(item.abbreviation).text(item.name)); });

					stateText.hide();
					stateSelect.html(ss.html()).trigger("change").show();
				}
				else {
					stateSelect.hide();
					stateText.val("").show().trigger("change");
				}

				//if (c.isHagueMember) {
				//    $("#tab_options [data-detailtype='apostillecountry'] select").val(c.name);
				//}
				//else {
				//    $("#tab_options [data-detailtype='apostillecountry'] select").val("");
				//}

				//_isinternational = c.name != "United States";

			}).trigger("change");


			//options
			//skm 2015.02.06
			//$("#tab_options [data-detailtype='apostillecountry'] select").html($apostille.html());
			$("#addonscontent [data-detailtype='apostillecountry'] select").html($apostille.html());
		}
	});
}
function getContactInfo(prefix) {
	var ci = {};
	ci.salutationType = $("#" + prefix + "salutation").length ? (($("#" + prefix + "salutation").val() == "") ? null : $("#" + prefix + "salutation").val()) : null;
	ci.firstName = $("#" + prefix + "firstName").length ? $("#" + prefix + "firstName").val() : "";
	ci.lastName = $("#" + prefix + "lastName").length ? $("#" + prefix + "lastName").val() : $("#" + prefix + "name").val();
	ci.streetAddress = ($("#" + prefix + "streetAddress2").val() == "") ? $("#" + prefix + "streetAddress1").val() : $("#" + prefix + "streetAddress1").val() + "\n" + $("#" + prefix + "streetAddress2").val();
	ci.city = $("#" + prefix + "county").length ? $("#" + prefix + "city").val() + ", " + $("#" + prefix + "county").val() : $("#" + prefix + "city").val();
	ci.state = $("#" + prefix + "state").val();
	ci.postal = $("#" + prefix + "postal").val();
	ci.country = $("#" + prefix + "country").val();
	ci.email = $("#" + prefix + "email").val();
	ci.phone = $("#" + prefix + "phone").val();

	if (ci.firstName != "" && ci.lastName == "") {
		ci.lastName = ci.firstName;
		ci.firstName = "";
	}

	return ci;
}
function getEntityInfo() {
	var ei = {};

	//is there entity info?
	if ($("#company_name").data("entityinfo")) {
		ei = $("#company_name").data("entityinfo");
	}
	else {
		ei.name = $("#company_name").val();
		ei.stateType = $("#company_state").val();
		ei.type = $("#company_type").val();
		ei.id = null;
		ei.active = null;
		ei.incorporationDate = null;
		ei.fileNumber = null;
	}

	return ei;
}
function getItems() {
	var arr = [];

	//get package - until new form is ready
	var l_pid = $("packageSelect").val(); // $('input:radio[name=packageSelect]:checked').val();
	if (l_pid) {
		var l_q = 1
		var l_up = getUnitPrice(l_pid, _key);
		var l_d = {};
		$("[data-detailsforproductid='" + l_pid + "'] label[data-detailkey]").each(function (di, ditem) {
			var $label = $(ditem);
			var l_key = $label.data("detailkey");
			var l_value = $label.find(":input").val();
			l_d[l_key] = l_value;
		});

		var l_pitem = {};
		l_pitem.quantity = l_q;
		l_pitem.unitPrice = l_up;
		l_pitem.productId = l_pid;
		l_pitem.details = l_d;

		//alert('gi[' + l_pitem.unitPrice + ']');
		arr.push(l_pitem);
	}

	$("[data-productid]").has(".productcontrol :input:enabled").add("[data-productid][data-disable]").find(".productcontrol :input").each(function (i, item) {
		var $control = $(item);

		//get quantity
		var q = $control.closest("[data-productid]").data("quantity");

		//skip it if not positive
		if (!q) return true;

		//get productid
		var pid = $control.closest("[data-productid]").data("productid");

		//get unit price
		var up = $control.closest("[data-productid]").data("unitprice");

		//get details
		var d = {};
		$("[data-detailsforproductid='" + pid + "'] label[data-detailkey]").each(function (di, ditem) {
			var $label = $(ditem);
			var key = $label.data("detailkey");
			var value = $label.find(":input").val();
			d[key] = value;
		});

		//new incorporation alternate name
		if ($control.is(":radio[name='options_incorporation']")) if ($("#company_alternate_name").val() != "") d["alternate"] = $("#company_alternate_name").val();

		//custom names
		if ($control.closest("[data-productid]").is("[data-customname]")) d["name"] = $control.closest("[data-productid]").find(":text").val();

		var pitem = {};
		pitem.quantity = q;
		pitem.unitPrice = up;
		pitem.productId = pid;
		pitem.details = d;

		arr.push(pitem);
	});

	return arr;
}
function getParties() {
	var arr = [];

	if (!_isexistingordertype) {
		$("[data-titletype]").has("[data-name]:enabled").each(function (i, item) {
			var $element = $(item);

			//set name
			var n = $element.find("[data-name]").val();
			if (n == "") return true;

			//get party index
			var pi = -1;
			$.each(arr, function (ai, aitem) { if (aitem.contactInfo.lastName.toUpperCase() == n.toUpperCase()) { pi = ai; return false; } });
			if (pi == -1) { arr.push({ contactInfo: { lastName: n }, titles: [], ownership: 0, shares: 0, isTaxMember: false }); pi = arr.length - 1; }

			//titles
			var t = $element.data("titletype");
			arr[pi].titles.push(t);

			//owenership
			if ($element.find("[data-ownership]").length) if (isNaN(parseFloat($element.find("[data-ownership]")))) arr[pi].ownership = parseFloat($element.find("[data-ownership]").val());

			//tax matters
			if ($element.find("[data-taxmatters]").length) if ($element.find("[data-taxmatters]").is(":radio")) arr[pi].isTaxMember = $element.find("[data-taxmatters]").prop("checked");

			//shares
			if ($element.find("[data-shares]").length) if (isNaN(parseFloat($element.find("[data-shares]")))) arr[pi].shares = parseFloat($element.find("[data-shares]").val());

			//partner
			if (t == 8) arr[pi].contactInfo = getContactInfo("company_partner_");
		});
	}

	return arr;
}
function getPayment() {
	var p = {};

	p.paymentMethodType = $(":radio[name='review_payment_method']:checked").val();
	p.id = (p.paymentMethodType == 0) ? $("#review_card").val() : null;

	return p;
}
function getOrder() {
	var o = {};

	//lead
	o.lead = getLead();

	//account
	o.account = getAccount();

	//payment
	o.payment = getPayment();

	//requests
	o.requests = $("#options_special_requests").val();

	//contact
	o.contact = $("#company_future_same_as_order_contact").is(":enabled:not(:checked)") ? getContactInfo("company_future_contact_") : null;

	//promo code
	o.promoCode = ($("#review_promo_code").data("discount") > 0) ? $("#review_promo_code").val() : null;

	//quote
	o.quoteId = _quoteid;

	//entity
	var e = {};

	e.info = getEntityInfo();
	e.items = getItems();
	//alert('go[' + e.items.length + ']');
	e.parties = getParties();

	o.entities = [e];

	return o;
}
function getServerReadyOrder() {
	//need to swap states for qualification

	//alert('gso');
	var o = getOrder();

	//add wire fee
	if ($(":radio[name='review_payment_method']:checked").val() == 3) {
		var haswirefee = $.grep(o.entities[0].items, function (item, i) { return item.id == _wirefeeproductid; }).length;

		if (!haswirefee) {
			var up = getUnitPrice(_wirefeeproductid, _key);

			var i = {};
			i.quantity = 1;
			i.unitPrice = up;
			i.productId = _wirefeeproductid;
			i.details = {};

			o.entities[0].items.push(i);
		}
	}

	//THIS FUNCTION ASSUMES MAX 1 QUALIFICATION PER ORDER

	//if there isn't a qualification, return order as is
	var qitems = $.grep(o.entities[0].items, function (item, i) { return item.productId == _qualificationproductid; });
	if (!qitems.length) return o;
	qitems[0].details["homestate"] = apiType("stateTypes", o.entities[0].info.stateType).label;

	//get qualification state
	var qs = apiType("stateTypes", qitems[0].details["state"]);
	if (!qs) return o;

	//get all non-qualification items
	var nqi = $.grep(o.entities[0].items, function (item, i) { return item.productId != _qualificationproductid; });

	//determine if any of the prices would be different if states were swapped
	var anydifferentprices =
		($.grep(nqi, function (item, i) {
			var currentstateprice = getUnitPrice(item.productId, _key);
			var newstateprice = getUnitPrice(item.productId, qs.id + "-" + _key.split("-")[1]);
			return currentstateprice != newstateprice;
		}).length > 0);

	//create new entity info
	var newentityinfo = {};
	$.extend(newentityinfo, o.entities[0].info);
	for (var property in newentityinfo) {
		switch (property) {
			case "name":
				//leave it
				break;
			case "stateType":
				newentityinfo[property] = qs.id;
				break;
			case "type":
				var ne = apiType("entityTypes", newentityinfo.type);
				newentityinfo[property] = (ne) ? (ne.superType ? ne.superType : ne.id) : 0;
				break;
			default:
				newentityinfo[property] = null;
		}
	}

	//set new values
	if (anydifferentprices) {
		//create a new entity for the qualification
		var e = {};
		e.info = newentityinfo;
		e.items = [qitems[0]];
		e.parties = [];
		o.entities.push(e);

		//remove item from current order entity
		var newitems = $.grep(o.entities[0].items, function (item, i) { return item.productId != _qualificationproductid; });
		o.entities[0].items = newitems;
	}
	else {
		//change the current entity info
		o.entities[0].info = newentityinfo;
	}

	return o;
}
function updateTotalText() {
	var total = _subtotal;

	//wire
	//if ($(":radio[name='review_payment_method']:checked").val() == 3) total += getUnitPrice(_wirefeeproductid, _key);

	//promo
	total -= $("#review_promo_code").data("discount");

	$("#review_total_text").text("Total: " + formatMoney(total));
}
function displayCreditCardOption(c) {
	if (!c) return;

	var o = $("<option>").val(c.profileId).text(c.name);
	$("#review_card option:first").after(o);
	$("#review_card").val(c.profileId).show().trigger("change");
	$("#review_new_card").find(":text").val("");
}
function getLead() {
	if (_accountid) return null;

	var lead = {};

	//ids
	lead.id = _leadid || $.cookie("leadid");
	lead.tempId = _templeadid || ($.cookie("templeadid") ? $.cookie("templeadid") : _tempid);

	//contact info
	lead.contactInfo = getContactInfo("company_order_contact_");

	//entity info
	lead.entityInfo = getEntityInfo();

	//description & leadsource
	lead.description = $("#options_special_requests").val();
	lead.leadSourceType = _isexistingordertype ? 4 : 3;

	return lead;
}
function setLead(leadid, templeadid) {
	_leadid = leadid || null;
	_templeadid = templeadid || null;
	$.cookie("leadid", _leadid, _cookiesettings);
	$.cookie("templeadid", _templeadid, _cookiesettings);
}
function updateLead() {
	if (_updatinglead || _accountid) return;

	var lead = getLead();

	if (lead.contactInfo.lastName && lead.contactInfo.email) { // Don't update unless there is an email address, or else Pardot won't get synced
		_updatinglead = true;
		$.ajax({
			url: _baseapiurl + "/lead",
			data: JSON.stringify(lead),
			success: function (msg) {
				_updatinglead = false;
				setLead(msg.id, msg.tempId);
			},
			error: function () {
				_updatinglead = false;
			}
		});
	}
}
function initLeadUpdate() {
	$("#company_order_contact_firstName, #company_order_contact_lastName, #company_order_contact_email, #company_name, #options_special_requests, #company_state, #company_type").on("change", function () { updateLead(); }).first().trigger("change"); //$("body").is(".ajaxing") ||
}
function getAccount() {
	if (_accountid) {
		var a = {};
		a.id = _accountid;
		a.authKey = _authkey;
		return a;
	}
	else {
		return null;
	}
}
function setAccount(accountid, authkey) {
	_accountid = accountid || null;
	_authkey = authkey || null;
	$.cookie("accountid", _accountid, _cookiesettings);
}
function setAccountContactInfo(ci) {
	if (!ci) return;
	//display readonly
	$("#company_order_contact_readonly").html(getContactInfoReviewHtml(ci)).show();

	//hide editable and set values
	if (ci.salutationType) $("#company_order_contact_salutation").val(ci.salutationType);
	$("#company_order_contact_firstName").val(ci.firstName);
	$("#company_order_contact_lastName").val(ci.lastName);
	$("#company_order_contact_streetAddress1").val(ci.streetAddress.split("\n").join(", "));
	$("#company_order_contact_city").val(ci.city);
	$("#company_order_contact_state_select").html("").append($("<option>").val(ci.state).text(ci.state)).off("change");
	$("#company_order_contact_state").val(ci.state);
	$("#company_order_contact_postal").val(ci.postal);
	$("#company_order_contact_country").html("").append($("<option>").val(ci.country).text(ci.country)).off("change");
	$("#company_order_contact_phone").val(ci.phone);
	$("#company_order_contact_email").val(ci.email);

	//helpers
	_isdelaware = ci.state == "DE";
	_isinternational = ci.country != "UNITED STATES";

	$("#company_order_contact_editable").hide().find(":text[data-required]").prop("disabled", true).removeAttr("data-required").removeData("required").first().trigger("change");
}
function setLeadContactInfo(ci) {
	if (ci.salutationType) $("#company_order_contact_salutation").val(ci.salutationType);
	$("#company_order_contact_firstName").val(ci.firstName);
	$("#company_order_contact_lastName").val(ci.lastName);
	$("#company_order_contact_streetAddress1").val(ci.streetAddress.split("\n").join(", "));
	$("#company_order_contact_city").val(ci.city);

	$("#company_order_contact_state").val(ci.state);
	$("#company_order_contact_postal").val(ci.postal);

	$("#company_order_contact_phone").val(ci.phone);
	$("#company_order_contact_email").val(ci.email);

	$.each(_countries, function (i, item) {
		if (item.name == ci.country) {
			$("#company_order_contact_country").val(item.name).trigger("change");
			if (item.states.length) {
				$.each(item.states, function (si, sitem) {
					if (ci.state == sitem.name) {
						$("#company_order_contact_state_select").val(sitem.abbreviation).trigger("change");
						return false;
					}
				});
			}
			else {
				$("#company_order_contact_state").val(ci.state).trigger("change");
			}
			return false;
		}
	});
}
function setAccountPaymentProfile(p) {
	if (!p) return;

	$.each(p.paymentProfiles.reverse(), function (i, item) { displayCreditCardOption(item); });
}
function setEntityInfo(ei) {
	if (!ei) return;

	var s = apiType("stateTypes", ei.stateType);
	var e = apiType("entityTypes", ei.type);

	if (s) $("#company_state").data("preferredvalue", s.id).val(s.id).trigger("change");
	if (e) $("#company_type").data("preferredvalue", e.id).val(e.id).trigger("change");

	$("#company_name").data("entityinfo", ei).val(ei.name).trigger("change");
}

function displayCreditCardOption(c) {
	if (!c) return;

	var o = $("<option>").val(c.profileId).text(c.name);
	$("#review_card option:first").after(o);
	$("#review_card").val(c.profileId).show().trigger("change");
	$("#review_new_card").find(":text").val("");
}

function refreshCompany() {
	var $tab = $("#tab_company");

	//hide/show elements
	$tab.find("[data-new]").toggle(!_isexistingordertype);
	$tab.find("[data-existing]").toggle(_isexistingordertype);
	$tab.find("[data-new] :input").prop("disabled", _isexistingordertype);
	$tab.find("[data-existing] :input").prop("disabled", !_isexistingordertype);
	$tab.find(".company_title_wrapper [data-required]:input").prop("disabled", _isexistingordertype);

	//trigger type change to cascade changes
	$("#company_type").trigger("change");

	//toggle autocomplete on company name
	$("#company_name").autocomplete(_isexistingordertype ? "enable" : "disable");

	$("#company_future_contact_wrapper").toggle(!_isexistingordertype && !$("#company_future_same_as_order_contact").prop("checked"));
	$("#company_future_contact_wrapper :input").prop("disabled", _isexistingordertype || $("#company_future_same_as_order_contact").prop("checked"));

	//$("#company_accordion [data-required]:first").trigger("change");

	//activate first state/type panel
	$tab.find("#company_accordion").accordion("option", "active", 0);//.accordion("option", "collapsible", true);
	//setTimeout(function () { $tab.find("#company_accordion").accordion("option", "collapsible", false) }, 1000);
}
function oldRefreshOptions(p_Tab) {
	var $tab = $(p_Tab);

	//hide/show elements
	$tab.find(".options_wrapper").show();
	$tab.find("[data-productid], [data-detailsforproductid]").hide().find(":input").prop("disabled", true);

	var arrIds = getProductIds();
	var pids = arrIds[0];

	var invisibleIds = arrIds[1];

	$tab.find("[data-productid]").each(function (i, item) {
		var $element = $(item);
		var pid = $element.data("productid");

		if ($.inArray(pid, pids) > -1) {
			$element.show().find(":input").prop("disabled", false);
		}

		//additional series
		if (pid == _additionalseriesproductid) {
			var q = getAdditionalSeriesCount();
			$element.find("select").html("").append($("<option>").text(q)).prop("disabled", true).trigger("change");
			if (q == 0) $element.hide();
		}

		//additional stockholder
		if (pid == _additionalstockholderproductid) {
			var q = getAdditionalStockholderCount();
			$element.find("select").html("").append($("<option>").text(q)).prop("disabled", true).trigger("change");
			if (q == 0) $element.hide();
		}

		//custom price
		if ($element.is("[data-customprice]")) {
			if ($.inArray(pid, invisibleIds) <= -1) {
				$element.show().find(":input").prop("disabled", false);
			}
		}
	});
	$tab.find(".productcontrol:enabled").find(":checkbox, :radio, select").trigger("change");

	$("#options_incorporation :radio:visible:first").prop("checked", true).trigger("change");
	$("#options_incorporation :radio").trigger("change");

	$tab.find("[data-domestic]").toggle(!_isinternational).find(":input").prop("disabled", _isinternational);
	$tab.find("[data-international]").toggle(_isinternational).find(":input").prop("disabled", !_isinternational);
	if (!_isdelaware) $tab.find("[data-delaware]").hide().find(":input").prop("disabled", true);

	$tab.find("[data-new]").toggle(!_isexistingordertype).find(":input").prop("disabled", _isexistingordertype);
	$tab.find("[data-existing]").toggle(_isexistingordertype).find(":input").prop("disabled", !_isexistingordertype);

	$(".options_wrapper").each(function (i, item) {
		var $wrapper = $(item);
		var visiblerows = $wrapper.find("div:visible").length;
		$wrapper.toggle(visiblerows > 0);
	})

	//apostille countries
	if (_isinternational) {
		var cname = $("#company_order_contact_country").val();
		var carr = $.grep(_countries, function (item, i) { return item.name == cname; });
		if (carr.length) {
			if (carr[0].isHagueMember) $tab.find("label[data-detailtype='apostillecountry'] select").each(function (i, item) { var $s = $(item); if ($s.val() == "") $s.val(carr[0].name); });
		}
	}

	//qualification
	if ($tab.find("label[data-detailtype='qualificationstate']").length) {

		//var homestateid = $("#company_state").val();
		var homestateid = _companystate;
		var q = $.grep(_products, function (item, i) { return item.id == _qualificationproductid; })[0];
		var stateids = getFeeStateIds(q.fees);
		var $s = $("<select>");
		$.each(_staticdata.stateTypes, function (i, item) {
			if (item.id != homestateid && $.inArray(item.id, stateids) > -1) $s.append($("<option>").val(item.label).text(item.name)); //IMPORTANT TO SET OPTION VALUE TO STATE LABEL
		});
		$tab.find("label[data-detailtype='qualificationstate'] select").html($s.html());//.trigger("change");
	}

	//update unit prices on all visible products
	$tab.find("div[data-productid]:visible").each(function (i, item) {
		var $li = $(item);
		updateUnitPrice($li);
		var p = $li.data("preferred");
		if (p) {
			var $control = $li.find(".productcontrol :input");
			if ($control.is("select")) $control.val(p); else $control.prop("checked", true);
			$control.trigger("change");
			$li.data("preferred", 0);
		}
	});

	//skm
	//update unit prices on all visible packages
	$tab.find("input[data-productid]:visible").each(function (i, item) {
		var $input = $(item);
		updateUnitPricePackage($input);
	});

}
//		function refreshReview() {
//
//			var o = getOrder();
//
//			setSummary();
//		}
//
var _baseapiurl = 'https://secure.incnow.com/v1_sandbox';

var _staticdata = {
	actions: [{ id: 0, key: "PayNow", label: "Pay Now" }, { id: 1, key: "PayLater", label: "Pay Later" }, { id: 2, key: "Cancel", label: "Cancel" }],
	stateTypes: [{ id: 0, key: "a048000000KoC4CAAV", label: "DE", name: "Delaware" }, { id: 1, key: "a048000000KoC4EAAV", label: "FL", name: "Florida" }, { id: 2, key: "a048000000KoC4XAAV", label: "NV", name: "Nevada" }, { id: 3, key: "a048000000KoC45AAF", label: "AL", name: "Alabama" }, { id: 4, key: "a048000000KoC46AAF", label: "AK", name: "Alaska" }, { id: 5, key: "a048000000KoC47AAF", label: "AZ", name: "Arizona" }, { id: 6, key: "a048000000KoC48AAF", label: "AR", name: "Arkansas" }, { id: 7, key: "a048000000KoC49AAF", label: "CA", name: "California" }, { id: 8, key: "a048000000KoC4AAAV", label: "CO", name: "Colorado" }, { id: 9, key: "a048000000KoC4BAAV", label: "CT", name: "Connecticut" }, { id: 10, key: "a048000000KoC4DAAV", label: "DC", name: "District of Columbia" }, { id: 11, key: "a048000000KoC4FAAV", label: "GA", name: "Georgia" }, { id: 12, key: "a048000000KoC4GAAV", label: "HI", name: "Hawaii" }, { id: 13, key: "a048000000KoC4HAAV", label: "ID", name: "Idaho" }, { id: 14, key: "a048000000KoC4IAAV", label: "IL", name: "Illinois" }, { id: 15, key: "a048000000KoC4JAAV", label: "IN", name: "Indiana" }, { id: 16, key: "a048000000KoC4KAAV", label: "IA", name: "Iowa" }, { id: 17, key: "a048000000KoC4LAAV", label: "KS", name: "Kansas" }, { id: 18, key: "a048000000KoC4MAAV", label: "KY", name: "Kentucky" }, { id: 19, key: "a048000000KoC4NAAV", label: "LA", name: "Louisiana" }, { id: 20, key: "a048000000KoC4OAAV", label: "ME", name: "Maine" }, { id: 21, key: "a048000000KoC4PAAV", label: "MD", name: "Maryland" }, { id: 22, key: "a048000000KoC4QAAV", label: "MA", name: "Massachusetts" }, { id: 23, key: "a048000000KoC4RAAV", label: "MI", name: "Michigan" }, { id: 24, key: "a048000000KoC4SAAV", label: "MN", name: "Minnesota" }, { id: 25, key: "a048000000KoC4TAAV", label: "MS", name: "Mississippi" }, { id: 26, key: "a048000000KoC4UAAV", label: "MO", name: "Missouri" }, { id: 27, key: "a048000000KoC4VAAV", label: "MT", name: "Montana" }, { id: 28, key: "a048000000KoC4WAAV", label: "NE", name: "Nebraska" }, { id: 29, key: "a048000000KoC4YAAV", label: "NH", name: "New Hampshire" }, { id: 30, key: "a048000000KoC4ZAAV", label: "NJ", name: "New Jersey" }, { id: 31, key: "a048000000KoC4aAAF", label: "NM", name: "New Mexico" }, { id: 32, key: "a048000000KoC4bAAF", label: "NY", name: "New York" }, { id: 33, key: "a048000000KoC4cAAF", label: "NC", name: "North Carolina" }, { id: 34, key: "a048000000KoC4dAAF", label: "ND", name: "North Dakota" }, { id: 35, key: "a048000000KoC4eAAF", label: "OH", name: "Ohio" }, { id: 36, key: "a048000000KoC4fAAF", label: "OK", name: "Oklahoma" }, { id: 37, key: "a048000000KoC4gAAF", label: "OR", name: "Oregon" }, { id: 38, key: "a048000000KoC4hAAF", label: "PA", name: "Pennsylvania" }, { id: 39, key: "a048000000KoC4iAAF", label: "RI", name: "Rhode Island" }, { id: 40, key: "a048000000KoC4jAAF", label: "SC", name: "South Carolina" }, { id: 41, key: "a048000000KoC4kAAF", label: "SD", name: "South Dakota" }, { id: 42, key: "a048000000KoC4lAAF", label: "TN", name: "Tennessee" }, { id: 43, key: "a048000000KoC4mAAF", label: "TX", name: "Texas" }, { id: 44, key: "a048000000KoC4nAAF", label: "UT", name: "Utah" }, { id: 45, key: "a048000000KoC4oAAF", label: "VT", name: "Vermont" }, { id: 46, key: "a048000000KoC4pAAF", label: "VA", name: "Virginia" }, { id: 47, key: "a048000000KoC4qAAF", label: "WA", name: "Washington" }, { id: 48, key: "a048000000KoC4rAAF", label: "WV", name: "West Virginia" }, { id: 49, key: "a048000000KoC4sAAF", label: "WI", name: "Wisconsin" }, { id: 50, key: "a048000000KoC4tAAF", label: "WY", name: "Wyoming" }],
	entityTypes: [{ id: 0, key: "LLC", label: "LLC", incnowCode: "LLC", superType: null, endings: ["LLC", "L.L.C.", "Limited Liability Company"] }, { id: 1, key: "Corporation", label: "Corporation", incnowCode: "Incorporation", superType: null, endings: ["Inc", "Inc.", "Incorporated", "Co", "Co.", "Company", "Corp", "Corp.", "Corporation", "Ltd", "Ltd.", "Limited"] }, { id: 2, key: "LP", label: "Limited Partnership", incnowCode: "LP", superType: null, endings: ["LP", "L.P.", "Limited Partnership"] }, { id: 3, key: "SeriesLLC", label: "Series LLC", incnowCode: "Series LLC", superType: 0, endings: ["LLC", "L.L.C.", "Limited Liability Company"] }, { id: 4, key: "NonProfitCorporation", label: "Non Profit Corporation", incnowCode: "Non-Profit", superType: 1, endings: ["Inc", "Inc.", "Incorporated", "Co", "Co.", "Company", "Corp", "Corp.", "Corporation", "Ltd", "Ltd.", "Limited", "Association", "Club", "Foundation", "Fund", "Institute", "Society", "Union", "Syndicate"] }],
	salutationTypes: [{ id: 0, key: "Mr", label: "Mr." }, { id: 1, key: "Ms", label: "Ms." }, { id: 2, key: "Mrs", label: "Mrs." }, { id: 3, key: "Dr", label: "Dr." }, { id: 4, key: "Prof", label: "Prof." }],
	sopAcceptedViaTypes: [{ id: 0, key: "ProcessServer", label: "Process Server" }, { id: 1, key: "DeputySheriff", label: "Deputy Sheriff" }, { id: 2, key: "CertifiedMail", label: "Certified Mail" }, { id: 3, key: "FedEx", label: "FedEx" }, { id: 4, key: "Other", label: "Other" }],
	sopTypes: [{ id: 0, key: "SummonsAndComplaint", label: "Summons And Complaint" }, { id: 1, key: "Subpoena", label: "Subpoena" }, { id: 2, key: "Motion", label: "Motion" }, { id: 3, key: "Garnishment", label: "Garnishment" }, { id: 4, key: "Other", label: "Other" }],
	stateEntityTitles: [{ id: 0, key: "Member", label: "Members" }, { id: 1, key: "Manager", label: "Managers" }, { id: 2, key: "Director", label: "Directors" }, { id: 3, key: "Stockholder", label: "Stockholders" }, { id: 4, key: "Series", label: "Series" }, { id: 5, key: "President", label: "President" }, { id: 6, key: "Treasurer", label: "Treasurer" }, { id: 7, key: "Secretary", label: "Secretary" }, { id: 8, key: "Partner", label: "Partner" }, { id: 9, key: "Agent", label: "Agent" }]
};
var _rauntil = "January 2016";
var _year = 2015;
var _tempid = "b7ab05fe054b492daf362574dcf9f8c3";

var _companystate;
var _companytype;

var f_States = ["DE", "FL", "NV"];
var f_Types = { LLC: "Limited Liability Corporation", LP: "Limited Partnership", CORP: "Corporation", SERIES: "Series LLC", NP: "Non-Profit Corporation" };
var f_Entities = {
	DE: ["Delaware", ["LLC", "LP", "CORP", "SERIES", "NP"]],
	FL: ["Florida", ["LLC", "CORP"]],
	NV: ["Nevada", ["LLC", "CORP", "SERIES"]]
};

function apiType(types, value) {
	if (value == null) return null;

	var valueisstring = (typeof value == "string");

	var arr = $.grep(_staticdata[types], function (item, i) {
		var match = false;

		if (!match && item.id != null) {
			match = (item.id == value);
		}
		if (!match && item.key) {
			match = valueisstring ? (item.key.toUpperCase() == value.toUpperCase()) : (item.key == value);
		}
		if (!match && item.label) {
			match = valueisstring ? (item.label.toUpperCase() == value.toUpperCase()) : (item.label == value);
		}
		if (!match && item.name) {
			match = valueisstring ? (item.name.toUpperCase() == value.toUpperCase()) : (item.name == value);
		}

		return match;
		//return typeof value == "string" ? (item.id == value || item.key == value.toUpperCase() || item.label == value || item.name == value) : (false);
	});


	if (arr.length) return arr[0];
	else return null;
}

function setKey(p_State, p_Type) {
	var l_key = '';

	switch (p_State) {
		case 'DE':
			l_key = '0-';
			_companystate = 0;
			break;
		case 'FL':
			l_key = '1-';
			_companystate = 1;
			break;
		case 'NV':
			l_key = '2-';
			_companystate = 2;
			break;
		default:
			l_key = '0-';
			_companystate = 0;
	}
	document.getElementById('company_state').value = _companystate;

	switch (p_Type) {
		case 'LLC':
			l_key += '0';
			_companytype = 0;
			break;
		case 'CORP':
			l_key += '1';
			_companytype = 1;
			break;
		case 'LP':
			l_key += '2';
			_companytype = 2;
			break;
		case 'SERIES':
			l_key += '3';
			_companytype = 3;
			break;
		case 'NP':
			l_key += '4';
			_companytype = 4;
			break;
		default:
			l_key += '0';
			_companytype = 0;
	}
	document.getElementById('company_type').value = _companytype;

	return l_key;
}

function setSummary() {

	//alert('ss');

	var l_o = getServerReadyOrder();

	$('ordersummary').html(JSON.stringify(l_o, null, 2));

	var l_summary = '<ul class="checklist" id="summaryitems">';
	//services
	_subtotal = 0;
	$.each(l_o.entities[0].items, function (i, item) {
		var p = $.grep(_products, function (pitem, pi) { return pitem.id == item.productId; })[0];

		l_summary += '<li>' + p.name + (item.quantity == 1 ? '' : ' x' + item.quantity);
		_subtotal += (item.quantity * item.unitPrice);
	});

	var total = _subtotal;

	//wire
	//if ($(":radio[name='review_payment_method']:checked").val() == 3) {
	//	total += getUnitPrice(_wirefeeproductid, _key);
	//	l_summary += '<li>' + _products[_wirefeeproductid];
	//}

	//promo
	if ($("#review_promo_code").data("discount") > 0) {
		total -= $("#review_promo_code").data("discount");
		l_summary += '<li>Promo: ' + formatMoney($("#review_promo_code").data("discount"));
	}

	l_summary += '</ul>';

	document.getElementById('optionssummary').innerHTML = l_summary;
	document.getElementById('totalsummary').innerHTML = '<h4>TOTAL</h4><h5>' + formatMoney(total) + '</h5>';

	updateTotalText();

}

function initCompany() {
	//company accordion
	//$("#company_accordion").accordion({ heightStyle: "content" });

	//buttons
	$(".btn_company_title_add").on("click", function () {
		var $li = $(this).closest(".company_title_wrapper").find("div:last").clone();
		//$li.find(":text").val("").removeAttr("data-required");
		//$li.find(":radio").prop("checked", false);
		$(this).closest(".company_title_wrapper").find("tbody").append($li);
		var $tb = $(this).closest(".company_title_wrapper").find("div:last [data-name]");
		//alert('1' + $tb);
		initNameAutocomplete($tb);

		var $ownershipwraper = $(this).closest("[data-defaulttotalownership]");
		if ($ownershipwraper.length) {
			$ownershipwraper.find("div [data-ownership]").val(parseInt($ownershipwraper.data("defaulttotalownership") / $ownershipwraper.find("div [data-ownership]").length));
		}

		var $shareswraper = $(this).closest("[data-defaulttotalshares]");
		if ($shareswraper.length) {
			$shareswraper.find("div [data-shares]").val(parseInt($shareswraper.data("defaulttotalshares") / $shareswraper.find("div [data-shares]").length));
		}
		$tb.focus();
	});

	//member ownership
	var $ownershipwraper = $("[data-defaulttotalownership]");
	if ($ownershipwraper.length) {
		$ownershipwraper.find("div [data-ownership]").val(parseInt($ownershipwraper.data("defaulttotalownership") / $ownershipwraper.find("div [data-ownership]").length));
	}

	//stockholder shares
	var $shareswraper = $("[data-defaulttotalshares]");
	if ($shareswraper.length) {
		$shareswraper.find("div [data-shares]").val(parseInt($shareswraper.data("defaulttotalshares") / $shareswraper.find("div [data-shares]").length));
	}

	////HIDING ELEMENTS ISNT ENOUGH, YOU NEED TO DISABLE THEM, THEN CHECK FOR EMPTY ENABLED ELEMENTS WITH [DATA-REQUIRED] ON KEYUP, CHANGE TO VALIDATE THE PAGE
	//$("#company_accordion [data-required]").on("change keyup", function () {
	//    var valid = true;
	//    $("#company_accordion [data-required]:enabled").each(function (i, item) {
	//        if ($(item).val() == "") valid = false;
	//        return valid;
	//    });

	//    $("#tab_company .btn_next").button(valid ? "enable" : "disable");
	//    //$("#main_tabs").tabs(valid ? "enable" : "disable", 2);
	//});


	$(".company_title_wrapper [data-name]").each(function (i, item) { initNameAutocomplete($(item)); });//.autocomplete({ minLength: 0, source: function (req, res) { res(getDistinctNames()); } });

	$("#company_future_same_as_order_contact").on("change", function () {
		$("#company_future_contact_wrapper").toggle(!$(this).prop("checked"));
		$("#company_future_contact_wrapper :input").prop("disabled", $(this).prop("checked"));
		$(".company_title_wrapper :text:enabled:first").trigger("change");
	});

	//wait for products to be inited so you can fill hague selects
	//initCountriesAndStates();
	$("#company_order_contact_country").on("change", function () {
		_isinternational = $(this).val() != "United States";
	});

	$("#company_order_contact_state, #company_future_contact_state").on("change", function () {
		updateIsDelaware();
	});

	var $s = $("<select>");
	$s.append($("<option>").val("").text("(none)"));
	$.each(_staticdata.salutationTypes, function (i, item) {
		$s.append($("<option>").val(item.id).text(item.label));
	});
	$("#company_order_contact_salutation, #company_future_contact_salutation").html($s.html());

	$("#company_alternate_name").on("blur", function () { updateCompanyNameEnding($(this)); });

	$("#company_name")
		.on("blur", function () {
			var name = $(this).val();
			//remove entityinfo data is blank
			if (name == "") {
				$(this).data("entityinfo", null);
			}
			else {
				if (_isexistingordertype) {
					//get entity info data
					var ei = $(this).data("entityinfo");

					if (!ei) {
						//if there isn't data, attempt to identify type from name
						var maybeLLC = (name.toUpperCase().indexOf(" LLC") > -1 || name.toUpperCase().indexOf(" L.L.C") > -1 || name.toUpperCase().indexOf(" LIMITED LIABILITY C") > -1);
						if (maybeLLC) $("#company_type").val(0).trigger("change");
					}
				}
				else {
					//new order type
					updateCompanyNameEnding($(this));
				}
			}
		})
		.autocomplete({
			minLength: 2,
			source: function (req, res) {
				$("#company_name").data("entityinfo", null);
				var d = {};
				d.query = req.term;
				d.entityStateType = $("#company_state").val();

				$.ajax({
					type: "GET",
					dataType: "jsonp",
					url: _baseapiurl + "/lookupentity",
					data: d,
					cache: true,
					success: function (msg) {
						$.each(msg, function (i, item) { item.label = item.name; if (item.fileNumber) item.label = item.label + " (#" + item.fileNumber + ")"; }); res(msg);
					}
				});
			}, select: function (event, ui) {
				$("#company_name").data("entityinfo", ui.item);
				var e = apiType("entityTypes", ui.item.type);
				$("#company_type").val(e.superType == null ? e.id : e.superType);
			}
		}).tooltip();

	$("#company_type").on("change", function () {
		_key = $("#company_state").val() + "-" + $("#company_type").val();
		var e = apiType("entityTypes", _key.split("-")[1]);
		var endingsstring = "'" + e.endings.join("', '") + "'";
		var companynamehelper = e.label + " name must end with one of the following: " + endingsstring;
		$("#company_name").attr("title", _isexistingordertype ? "" : companynamehelper);

		//toggle parties if new order type
		if (!_isexistingordertype) {
			$(".company_title_wrapper").each(function (i, item) {
				var tog = $.inArray(_key, $(item).data("stateentitytypes")) > -1;
				$(item).toggle(tog);
				$(item).find(":input").prop("disabled", !tog);
			});
		}

		//$(".company_title_wrapper :text:enabled:first").trigger("change");
	});

	$("#company_state").on("change", function () {
		var pv = $("#company_type").data("preferredvalue");
		var s = $(this).val();
		var $s = $("<select>");
		$.each(_staticdata.entityTypes, function (i, item) {
			//only show LLC & Corp, unless its DE and new order type
			if (i < 2
				|| (s == 0 && !_isexistingordertype)
				|| (s == 2 && i == 3 && !_isexistingordertype)) $s.append($("<option>").text(item.label).val(item.id).attr(item.id == pv ? "selected" : "data-x", "selected"));
		});
		$("#company_type").html($s.html()).trigger("change");
	});
}

function refreshOptions() {

	var arrIds = getProductIds();

	var pids = arrIds[0];
	var invisibleIds = arrIds[1];

	$(".options_wrapper").each(function (l_i, l_wrapperitem) {
		var $l_div = $(l_wrapperitem);

		$l_div.find("li[data-productid]").each(function (l_index, l_productitem) {
			var $element = $(l_productitem);
			var pid = $element.data("productid");

			if ($.inArray(pid, pids) > -1) {
				$element.show().find(":input").prop("disabled", false);
			}

			//additional series
			if (pid == _additionalseriesproductid) {
				var q = getAdditionalSeriesCount();
				$element.find("select").html("").append($("<option>").text(q)).prop("disabled", true).trigger("change");
				if (q == 0) $element.hide();
			}

			//additional stockholder
			if (pid == _additionalstockholderproductid) {
				var q = getAdditionalStockholderCount();
				$element.find("select").html("").append($("<option>").text(q)).prop("disabled", true).trigger("change");
				if (q == 0) $element.hide();
			}

			//custom price
			if ($element.is("[data-customprice]")) {
				if ($.inArray(pid, invisibleIds) <= -1) {
					$element.show().find(":input").prop("disabled", false);
				}
			}
		})
		$l_div.find(".productcontrol:enabled").find(":checkbox, :radio, select").trigger("change");

		$l_div.find("[data-domestic]").toggle(!_isinternational).find(":input").prop("disabled", _isinternational);
		$l_div.find("[data-international]").toggle(_isinternational).find(":input").prop("disabled", !_isinternational);
		if (!_isdelaware) $l_div.find("[data-delaware]").hide().find(":input").prop("disabled", true);

		$l_div.find("[data-new]").toggle(!_isexistingordertype).find(":input").prop("disabled", _isexistingordertype);
		$l_div.find("[data-existing]").toggle(_isexistingordertype).find(":input").prop("disabled", !_isexistingordertype);

		//qualification
		if ($l_div.find("label[data-detailtype='qualificationstate']").length) {

			//var homestateid = $("#company_state").val();
			var homestateid = _companystate;
			var q = $.grep(_products, function (item, i) { return item.id == _qualificationproductid; })[0];
			var stateids = getFeeStateIds(q.fees);
			var $s = $("<select>");
			$.each(_staticdata.stateTypes, function (i, item) {
				if (item.id != homestateid && $.inArray(item.id, stateids) > -1) $s.append($("<option>").val(item.label).text(item.name)); //IMPORTANT TO SET OPTION VALUE TO STATE LABEL
			});
			$l_div.find("label[data-detailtype='qualificationstate'] select").html($s.html());//.trigger("change");
		}

		//update unit prices on all visible products
		$l_div.find("li[data-productid]:visible").each(function (i, item) {
			var $l_li = $(item);
			updateUnitPrice($l_li);
			var p = $l_li.data("preferred");
			if (p) {
				var $control = $l_li.find(".productcontrol :input");
				if ($control.is("select")) $control.val(p); else $control.prop("checked", true);
				$control.trigger("change");
				$l_li.data("preferred", 0);
			}
		});

		//skm
		//update unit prices on all visible packages
		$l_div.find("input[data-productid]:visible").each(function (i, item) {
			var $input = $(item);
			updateUnitPricePackage($input);
		});

	})
};
function initOptions() {

	$(".options_wrapper").each(function (l_i, l_wrapperitem) {
		var $l_div = $(l_wrapperitem);

		$l_div.find("li[data-productid]").each(function (l_index, l_productitem) {
			//find product
			var $li = $(l_productitem);
			var id = $li.data("productid");

			var parr = $.grep(_products, function (pitem, pi) { return pitem.id == id; });
			if (!parr.length) return true; //if it's not found, skip it...

			var p = parr[0];
		//control
			var $c = null;
			if ($li.is("[data-radioname]")) {
				$c = $("<input>").attr("type", "radio").attr("name", $li.data("radioname"));
			}
			else if ($li.is("[data-multiple]")) {
				$c = $("<select>");
				for (var i = 0; i < 10; i++) {
					$c.append($("<option>").text(i));
				}
			}
			else {
				$c = $("<input>").attr("type", "checkbox");
			}
	
			if ($li.is("[data-disable]")) $c.prop("disabled", true);

			$li.append($("<span>").addClass("productcontrol").append($c));

			//name
			if ($li.is("[data-customname]")) {
				$li.append($("<label>").addClass("productname").append($("<input>").attr({ type: "text", placeholder: $li.data("customname") }).css("width", "90%")));
				initCustomNameCheckboxUpdate($li.find(":text"));
			}
			else {
				$li.append($("<label>").addClass("productname").text(p.name));
			}

			if ($li.is("[data-moreinfo]")) {
				//$li.append("<a class=\"show-it\" href=\"#\">What's This?</a>");
				$li.append("<a href=\"#\" class=\"show-it\">What's This?</a>");
			}
			//price
			$li.append(
				$("<span>").addClass("check-data tright alignright productprice " + ($li.is("[data-taxes]") ? "taxes" : "notaxes"))
					.append($("<span>").addClass("quantitytext"))
					.append($("<span>").addClass("unitpricetext"))
					.append($("<span>").addClass("ui-icon " + ($li.is("[data-taxes]") ? "ui-icon-info" : "")).attr("title", ($li.is("[data-taxes]") ? "Additional state taxes may be required." : "")))
			);
			if ($li.is("[data-moreinfo]")) {
				$li.append("<div class=\"show-me\" style=\"display: block;\">" + $("#"+$li.attr("data-moreinfo")).html() + "</div>");
			}
		});

		//create detail rows
		$l_div.find("li[data-detailsforproductid]").each(function (i, item) {
			var $l_li = $(item);

			//add controls
			$l_li.find("label[data-detailtype]").each(function (li, litem) {
				var $l = $(litem);

				switch ($l.data("detailtype")) {
					case "longtext":
						$l.append($("<textarea>").attr({ rows: 3, cols: 40, maxLength: 500 }));
						break;
					case "date":
						$l.append($("<input>").attr("type", "text"));
						$l.find(":text").datepicker({ changeMonth: true, changeYear: true }).datepicker("setDate", "0");;
						break;
					case "qualificationstate":
						$l.append($("<select>"));
						$l.find("select").on("change", function () { var $r = $(this).closest("ul").find("li[data-productid='" + $l_li.data("detailsforproductid") + "']"); updateUnitPrice($r); });
						break;
					case "currency":
						$l.append($("<input>").attr("type", "text"));
						$l.find(":text").on("blur", function () {
							var ctext = $(this).val();
							$(this).val(cleanMoney(ctext));
						}).trigger("blur");
						break;
					case "shorttext":
						$l.append($("<input>").attr("type", "text"));
						break;
					case "mediumtext":
						$l.append($("<textarea>").attr({ rows: 1, cols: 40, maxLength: 500 }));
						break;
					case "apostillecountry":
						$l.append($("<select>"));
						break;
					default:
						$l.hide();
				}
			});

			//style
			$l_li.addClass("productdetail");
			$l_li.prepend($("<span>").addClass("productcontrol"));
			//$tr.find("td:last").attr("colspan", 2);
		});

		//bind change event to toggle productdetails
		$l_div.find("li[data-productid] .productcontrol").find(":radio, :checkbox, select").each(function (i, item) { initProductControlUpdate($(item)); });

	})

	//fill in apostille counties
	initCountriesAndStates();

};

function oldInitOptions() {

	$tab = $('#tab_options');

	$(".btn_option_item_add").button({ icons: { primary: "ui-icon-plus" } })
		.on("click", function () {
			var $t = $(this).parent().find("section");
			var $tr = $t.find("div:last").clone();
			$tr.find(":checkbox").prop("checked", false);
			$tr.find(":text").val("");
			$t.append($tr);
			initProductControlUpdate($t.find("div:last :checkbox"));
			initCustomNameCheckboxUpdate($t.find("div:last :text"));
			updateUnitPrice($t.find("div:last"));
		});

	$tab.find("input[data-productid]").each(function (i, item) {
		var $input = $(item);
		var id = $input.data("productid");
		if (id == "01t80000003TAwhAAG") {
			id = id;
		}

		var parr = $.grep(_products, function (pitem, pi) { return pitem.id == id; });
		if (!parr.length) return true; //if it's not found, skip it...
		var p = parr[0];
		//control

		$input.addClass("productcontrol")
	});

	//create product rows
	$tab.find("div[data-productid]").each(function (i, item) {
		//find product
		var $tr = $(item);
		var id = $tr.data("productid");
		if (id == "01t80000003TAwhAAG") {
			id = id;
		}

		var parr = $.grep(_products, function (pitem, pi) { return pitem.id == id; });
		if (!parr.length) return true; //if it's not found, skip it...
		var p = parr[0];
		//control
		var $c = null;
		if ($tr.is("[data-radioname]")) {
			$c = $("<input>").attr("type", "radio").attr("name", $tr.data("radioname"));
		}
		else if ($tr.is("[data-multiple]")) {
			$c = $("<select>");
			for (var i = 0; i < 10; i++) {
				$c.append($("<option>").text(i));
			}
		}
		else {
			$c = $("<input>").attr("type", "checkbox");
		}

		if ($tr.is("[data-disable]")) $c.prop("disabled", true);

		$tr.append($("<td>").addClass("productcontrol").append($c));

		//name
		if ($tr.is("[data-customname]")) {
			$tr.append($("<td>").addClass("productname").append($("<input>").attr({ type: "text", placeholder: $tr.data("customname") }).css("width", "90%")));
			initCustomNameCheckboxUpdate($tr.find(":text"));
		}
		else {
			$tr.append($("<td>").addClass("productname").text(p.name));
		}

		//price
		$tr.append(
			$("<td>").addClass("productprice " + ($tr.is("[data-taxes]") ? "taxes" : "notaxes"))
				.append($("<span>").addClass("quantitytext"))
				.append($("<span>").addClass("unitpricetext"))
				.append($("<span>").addClass("ui-icon " + ($tr.is("[data-taxes]") ? "ui-icon-info" : "")).attr("title", ($tr.is("[data-taxes]") ? "Additional state taxes may be required." : "")))
			);
	});

	//create detail rows
	$tab.find("div[data-detailsforproductid]").each(function (i, item) {
		var $tr = $(item);

		//add controls
		$tr.find("label[data-detailtype]").each(function (li, litem) {
			var $l = $(litem);

			switch ($l.data("detailtype")) {
				case "longtext":
					$l.append($("<textarea>").attr({ rows: 3, cols: 40, maxLength: 500 }));
					break;
				case "date":
					$l.append($("<input>").attr("type", "text"));
					$l.find(":text").datepicker({ changeMonth: true, changeYear: true }).datepicker("setDate", "0");;
					break;
				case "qualificationstate":
					$l.append($("<select>"));
					$l.find("select").on("change", function () { var $r = $(this).closest("section").find("div[data-productid='" + $tr.data("detailsforproductid") + "']"); updateUnitPrice($r); });
					break;
				case "currency":
					$l.append($("<input>").attr("type", "text"));
					$l.find(":text").on("blur", function () {
						var ctext = $(this).val();
						$(this).val(cleanMoney(ctext));
					}).trigger("blur");
					break;
				case "shorttext":
					$l.append($("<input>").attr("type", "text"));
					break;
				case "mediumtext":
					$l.append($("<textarea>").attr({ rows: 1, cols: 40, maxLength: 500 }));
					break;
				case "apostillecountry":
					$l.append($("<select>"));
					break;
				default:
					$l.hide();
			}
		});

		//style
		$tr.addClass("productdetail");
		$tr.prepend($("<td>").addClass("productcontrol"));
		$tr.find("td:last").attr("colspan", 2);
	});

	//show and hide recommendation
	$(document).ready(function () {
		$('#recommend').hide();

	});

	//add ra language
	$tab.find("#options_incorporation li").each(function (i, item) {
		var $li = $(item);
		var $icon = $("<span>").addClass("ui-icon").addClass($li.is("[data-unchecked]") ? "ui-icon-close" : "ui-icon-check");

		if ($li.is("[data-rauntil]")) $li.text("Registered Agent service until " + "2016");

		$li.addClass($li.is("[data-unchecked]") ? "unchecked ui-state-error" : "checked ui-state-highlight");
		$li.prepend($icon);


	});

	$(".basicradio").click(
		function () {
			$("#recommend").show();
		});
	$(".completeradio").click(
	   function () {
	   	$("#recommend").hide();
	   });

	//bind change event to toggle productdetails
	$tab.find("div[data-productid] .productcontrol").find(":radio, :checkbox, select").each(function (i, item) { initProductControlUpdate($(item)); });

	//fill in apostille counties
	initCountriesAndStates();

}

$(document).ready(function () {

	// check where the shoppingcart-div is
	var offset = $('#summary').offset();

	$(window).scroll(function () {
		var scrollTop = $(window).scrollTop(); // check the visible top of the browser

		if (offset.top < scrollTop) $('#summary').addClass('fixed');
		else $('#summary').removeClass('fixed');
	});

	function initSelectedProduct(p_Mode, p_StateID, p_EntityType, p_ProductID) {

		$("#startradio").value = p_Mode;
		$("#company_state").value = p_StateID;
		$("#company_type").value = p_EntityType;
		$("#packageSelect").value = p_ProductID;

		_isexistingordertype = (p_Mode == "existing");
		_key = setKey(p_StateID, p_EntityType);
		var e = apiType("entityTypes", _key.split("-")[1]);
		var endingsstring = "'" + e.endings.join("', '") + "'";
		var companynamehelper = e.label + " name must end with one of the following: " + endingsstring;
		$("#company_name").attr("title", _isexistingordertype ? "" : companynamehelper);

		//toggle parties if new order type
		if (!_isexistingordertype) {
			$(".company_title_wrapper").each(function (i, item) {
				var tog = $.inArray(_key, $(item).data("stateentitytypes")) > -1;
				$(item).toggle(tog);
				$(item).find(":input").prop("disabled", !tog);
			});
		}

		var pArr = $.grep(_products, function (item, i) { return item.id == p_ProductID; });
		var l_product = pArr[0];

		var fArr = $.grep(l_product.fees, function (item, i) { return ((item.entityType == mapEntityType(p_EntityType)) && (item.stateType == p_StateID)); });
		var l_fee = fArr[0];
	}

	$("#separatecontactinfo").click(function () {
		if ($('#futurecontact').css('display') == 'none') {
			$('#futurecontact').show();
			$("#separatecontactinfo").find("img").attr("src", 'assets/img/reveal-uparrow.png');
		}
		else {
			$('#futurecontact').hide();
			$("#separatecontactinfo").find("img").attr("src", 'assets/img/reveal-downarrow.png');
		}
	})

	$.ajax({
		type: "GET",
		url: _baseapiurl + "/product",
		cache: true,
		success: function (msg) {
			_products = msg;

			//responsive-div.html?type=new&state=DE&entity=SERIES&product=01t80000003QCuuAAG complete series llc for delaware

			initSelectedProduct(queryObj['type'], queryObj['state'], queryObj['entity'], queryObj['product']);

			initOptions();

			refreshOptions();

			initCompany();
		}
	});

});
