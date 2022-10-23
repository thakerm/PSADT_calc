var cleaned;
// regex may be changed by the user. Note: date and month can be 1 or 2 digits, year must be 4 digits
var regex_template = "NUMBER DATE";
//var regex = /PSA(?:\s*,?\s*(?:(?:CANCER MONITORING)|SCREENING))?\s+(\d+(?:\.\d*)?)\s+(?:\(H\)\s+)?(\d{1,2}\/\d{1,2}\/\d{4})/;
var regex = null; // will be initialized from regex_template and this what is used to parse input
//var regex = /(\d+(?:\.\d*)?).+(\d{1,2}\/\d{1,2}\/\d{4})/;

var parsedTable; // this table is created at runtime.
var min_date; // earliest day we have in our table (we start w/ today as being a max value)
var discaredElem;

var debug = true;
var LOG = debug ? console.log.bind(console) : function () {}; // will turn off all console.log statements.

function validate_regex_box() {
  var e = document.getElementById("regex");
  var s = e.value;
  var isValid = true;
  try {
    regex = new RegExp(s); // this is what gets used in parsing inputs.
    e.style.backgroundColor = "lightgreen";
  } catch (err) {
    isValid = false;
    e.style.backgroundColor = "lightpink";
  }
  LOG("validate_regex_box  isvalid", isValid, "regex.toString()", regex.toString());
}

function raw_regex(r) {
  // drops the starting and ending '/' of a regex string representation
  // which confuses the process of going back and forth from RegExp to regex_string representation
  LOG("R",r);
  ans = r.toString();
  LOG("ans length", ans.length);
  if (ans.charAt(0) == "/") 
  {
    ans = ans.slice(1);
    //LOG("ans slice:", ans);
  }
  if (ans.charAt(ans.length - 1) == "/") 
  {
    //LOG("char at length -1: ",ans.charAt(ans.length - 1) );
    ans = ans.slice(0, ans.length - 1);
  }
  //LOG("ans:", ans);
  return ans;
}

function template_to_regex_str() {
  var e = document.getElementById("regex_template");
  var s = e.value;
  var orig = s.slice();
 
  processed = orig.replace(/\s+/g, raw_regex(RegExp(/.+?/).toString()));

  processed = processed.replace(
    /NUMBER/i,
    raw_regex(RegExp(/\b(?<number>\d+(?:\.\d*)?)\b/).toString())
  );
  processed = processed.replace(
    /\bDATE\b/i,
    raw_regex(RegExp(/\b(?<date>\d{1,2}\/\d{1,2}\/\d{4})\b/).toString())
  );
  LOG("orig", orig);
  LOG("processed", processed);
  var e = document.getElementById("regex");
  e.value = processed;
  validate_regex_box();
}

function load_regex_template() {
  var e = document.getElementById("regex_template");
  e.value = regex_template;
}

function show_regex() {
  regex_str = template_to_regex_str();
  LOG(`show_regex {${regex_str}}`);
  var e = document.getElementById("regex");
  e.value = regex_str;
  validate_regex_box();
}

function myOnload() {
  load_regex_template();
  template_to_regex_str();
  discardedElem = document.getElementById("discarded");
}

function onlySpaces(str) {
  return str.trim().length === 0;
}

function clearInput() {
  //LOG('enter clear');
  document.getElementById("entry").value = "";
  document.getElementById("PSA_calc").setAttribute("style","display:none");
}

function update_num_discarded(n) {
  var e = document.getElementById("num_discarded");
  e.innerHTML = `Number of non-blank lines discarded = ${n}`;
}
function parse() {
 
  text = document.getElementById("entry").value;
  document.getElementById("PSA_calc").setAttribute("style","display:block");
  PSA_text_edit = text.split("\n");
  min_date = new Date();
  cleaned = new Array();
  discarded = "";
  num_discarded = 0; // number of lines discarded
  LOG("parse: regex.toString()", regex.toString);
  for (const line of PSA_text_edit) 
  {
    if(line.match(/(FREE)/))
      continue;

    m = line.match(regex);
   
    if (!m) {
    
      // does this line match our regEx? If not....
      if (!onlySpaces(line)) {
        // just ignore blank lines totally
        if (discarded != "") {
          // need to add  new line if have some previous
          discarded += "\n";
        }
        discarded += `${line}`;
        num_discarded++;
      }
      continue; // line did not match, go to next
    }
    cleaned.push(line); // This line matched, it is saved for further processing
  }

  if (discarded.length > 0) {
    LOG("discarded", discarded.length, discarded);
    //alert(`Discarded Lines: ${discarded}`);
    discardedElem.value = discarded;
    update_num_discarded(num_discarded);
  }
  GenerateTable(cleaned);
  return;
}

function diff_days(dt2, dt1) {
  var diff = (dt2.getTime() - dt1.getTime()) / 1000;
  diff /= 60 * 60 * 24;
  return diff;
}

function reset_tables() {
  var thead;
  // fist, save the current input value
  parsedTable = document.createElement("TABLE");
  //parsedTable.setAttribute("onkeyup", "UpdateCalcs();")

  table_classes = "table-striped  table-sm table-hover table-primary PSA";
  parsedTable.setAttribute("class", table_classes);
  
}

function createCheckBox(parentCell, rowNum) {
  // creating checkbox element
  var checkbox = document.createElement("input");

  // Assigning the attributes to created checkbox
  myId = `derived_table_row_${rowNum}_checkbox`;
  checkbox.type = "checkbox";
  checkbox.name = myId;
  checkbox.value = myId;
  checkbox.checked = true;
  checkbox.id = myId;
  checkbox.onchange = function () {
    update_table(1);
  };

  // creating label for checkbox
  var label = document.createElement("label");

  // assigning attributes for the created label tag
  label.htmlFor = myId;

  // appending the created text to the created label tag
  label.appendChild(document.createTextNode("")); // we need no label in our use, just the checkbox

  // appending the checkbox  and label to div
  parentCell.appendChild(checkbox);
  parentCell.appendChild(label);
  return checkbox;
}

function GenerateTable(cleaned) {
  //Build an array containing Customer records.
  var input_label = ["PSA", "Date", "Days", "ln(PSA)", "Include in Calc"];

  reset_tables(); // parsedTable  will be reset after this call.

  //Get the count of columns.
  columnCount = input_label.length;
  rowCount = cleaned.length; // 'cleaned' was generated by parse()
  LOG("rowCount", rowCount, "columnCount", columnCount);

  // Fill out rest of 'input_table' add the data rows
  for (var i = 0; i < rowCount + 1; i++) {
    // +1 is for the header
    var row = parsedTable.insertRow(-1);
    //if (i == 0) row.setAttribute("class", "table-primary");
    if (i > 0) {
      LOG("i", i, "line", cleaned[i - 1]);
      match = cleaned[i - 1].match(regex); // need to do i-1 as we now have header row
      LOG("match", match);
      var date_x = new Date(match.groups.date);
      //LOG('date_x', date_x, 'min_date', min_date)
      if (date_x < min_date) {
        min_date = date_x;
        LOG("min_date", min_date);
      }
    }

    for (var j = 0; j < columnCount; j++) {
      // there is a label_column, then input value columns
      var cell;
      if (i == 0) {
        // heading row
        cell = document.createElement("TH");
        cell.innerHTML = input_label[j]; // header values
        row.appendChild(cell);
      } else {
        cell = row.insertCell(-1);
        cell.id = `input_${i}_${j}`; // we will use this tag to retrieve values for calculations
        cell.contentEditable = false; // by default all the cells are not editable (will change some below)
        //set_input_color(cell)
        if (j <= 1) {
          //LOG(i,j,'match',match)
          if (j == 0) {
            val = match.groups.number; // PSA measurement
            //cell.inputmode = "numeric"  // This does not seem to set on a table cell (need input element?)
          }
          if (j == 1) {
            val = match.groups.date; // date of measurement
          }
          cell.innerHTML = val;
          // TODO, for now we leave this uneditable till we take care of onchange.
          cell.contentEditable = true; // these two values can be changed by the user.
          cell.onchange = function () {
            LOG("cell.onchange");
            update_table(1);
          };
        } else if (j == 4) {
          // this will be the 'include in calc' checkbox
          cbox = createCheckBox(cell, i);
          cell.style.textAlign = "center";
        } else {
          cell.innerHTML = ""; // init the 'days' column with empty string (will be filled later)
        }
        LOG(i, j, cell);
      }
    }
  }

  update_table(1);
}

function update_table(do_calc = 0) {
  // gets called with do_calc=1 when calculations are to be done.
  var PSA_data_Elem = document.getElementById("PSA_data");
  PSA_data_Elem.innerHTML = "";
  PSA_data_Elem.appendChild(parsedTable);
  // we must do above before we can manipulate the 'Days' column via querySelector()
  var for_regression = new Array();
  for (var i = 1; i < rowCount + 1; i++) {
    // +1 as we have to skip  the header row (which is row 0)

    // if the row is not selected it is not included in doubling time calculations
    cbox = document.querySelector(`#derived_table_row_${i}_checkbox`);
    if (cbox.checked == false) continue;

    cell_psa = document.querySelector(`#input_${i}_0`);
    psa_value = parseFloat(cell_psa.innerHTML);
    cell_psa.align = "right";
    LOG("update_table  psa_value", psa_value);

    cell_date = document.querySelector(`#input_${i}_1`);
    cell_date.align = "right";

    date_x = new Date(cell_date.innerHTML);
    //LOG('date_x', date_x, 'min_date', min_date)
    delta_d = diff_days(date_x, min_date);
    //LOG('delta_d', delta_d)
    document.querySelector(`#input_${i}_2`).innerHTML = delta_d.toFixed(0);
    document.querySelector(`#input_${i}_2`).style.color = "purple";
    document.querySelector(`#input_${i}_2`).align = "right";

    log_psa_value = Math.log(psa_value);
    document.querySelector(`#input_${i}_3`).innerHTML = log_psa_value.toFixed(2);
    document.querySelector(`#input_${i}_3`).style.color = "purple";
    document.querySelector(`#input_${i}_3`).align = "right";
    //LOG(delta_d, psa_value)
    for_regression.push(new Array(delta_d, Math.log(psa_value)));
  }
  if (for_regression.length < 2) {
    alert("must have at least 2 PSA data samples\nSee discarded lines below");
    return;
  }

  if (do_calc) {
    do_regression(for_regression);
  }
}

function do_regression(for_regression) {
  for_regression.sort(function (a, b) {
    return a[0] < b[0];
  });
  LOG("for_regression", for_regression);
  var lr = ss.linearRegression(for_regression);
  LOG("lr", lr, typeof lr, lr.m);
  psadt = Math.log(2) / lr.m;
  LOG("PSA Doubling Time", psadt, "days");
  psadt_months = psadt / 30.4375;
  LOG("PSA Doubling Time", psadt_months, "months"); // 365.25/12 for number of days in a month
  psadt_years = psadt / 365.25;
  // Google Chart is now used. It will also show trendlines so later we can remove simpleStatistics
  doChart(for_regression);
  psadt_months_elem = document.getElementById("psadt_months");
  psadt_months_elem.value = psadt_months.toFixed(1) + " Months";
  psadt_years_elem = document.getElementById("psadt_years");
  psadt_years_elem.value = psadt_years.toFixed(2) + " Years";
}

function doChart(dataA) {
  dataA.unshift(new Array("Days", "PSA"));
  LOG(dataA);
  drawChart(dataA);
}

function drawChart(dataArray) {
  // Set Data
 
  var data = google.visualization.arrayToDataTable(dataArray);
  // Set Options
  var options = {
    title: `Days vs ln(PSA)  [${dataArray.length - 1} points provided]`, // - 1 as there is a heading row
    titleTextStyle: {
      color: "purple", // any HTML string color ('red', '#cc00cc')
      fontName: "Times New Roman", // i.e. 'Times New Roman'
      fontSize: 18, // 12, 18 whatever you want (don't specify px)
      bold: true, // true or false
      italic: false, // true of false
    },
    hAxis: {
      title: "Days",
      titleTextStyle: { fontSize: 16, italic: false },
      //textStyle: { fontSize: 12 },
    },

    vAxis: {
      title: "ln(PSA) [natural log of PSA]",
      titleTextStyle: { fontSize: 16, italic: false },
      //textStyle: { fontSize: 8 },
    },
    //width: 640,
    //height: 480,
    chartArea: { width: "60%", height: "60%" },
    //chartArea: { left:80, top: 10, bottom:10, width: "90%", height: "90%" },
    legend: { position: "right" },
    trendlines: {
      0: {
        type: "linear",
        visibleInLegend: true,
        color: "green",
        lineWidth: 4,
        showR2: true,
      },
    }, // Draw a trendline for data series 0.
  };
  // Draw Chart
  var chart = new google.visualization.ScatterChart(document.getElementById("myChart"));
  chart.draw(data, options);
}

function scatterPlot()
{
  var scatterPlotDiv = document.getElementById("scatterplotdiv");
  var scatterCheckBox = document.getElementById("scatter");
  if (scatterCheckBox.checked==true)
  {
    scatterPlotDiv.style.display="block";
  }
  else
  {
    scatterPlotDiv.style.display="none";
  }
}

function advancedToggle()
{
  var inputtemplate = document.getElementById("inputtemplate");
  var advancedCheckBox = document.getElementById("advanced");
  var discardTemplate = document.getElementById("discardTemplate");
  if (advancedCheckBox.checked==true)
  {
    inputtemplate.style.display="block";
    discardTemplate.style.display="block";
  }
  else
  {
    inputtemplate.style.display="none";
    discardTemplate.style.display="none";
  }

}

function copyPaste (copy_paste, button_id)
{
  var copyText = document.querySelector(copy_paste);
  copyText.select();
  copyText.setSelectionRange(0, 99999); // For mobile devices
  navigator.clipboard.writeText("PSA Doubling Time: " + copyText.value);x
  document.querySelector(button_id).className="btn btn-success";
  document.querySelector(button_id).innerHTML="Copied";
  
}


