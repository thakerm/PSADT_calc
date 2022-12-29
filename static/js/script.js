var cleaned;
// regex may be changed by the user. Note: date and month can be 1 or 2 digits, year must be 4 digits
var regex_template = "PSA DATE";
var regex_template_2 = "DATE PSA";
var regex_psa_date =
  "\b(?<number>d+(?:.d*)?)\b.+?\b(?<date>d{1,2}/d{1,2}/d{4})\b";
var regex_date_psa =
  "\b(?<date>d{1,2}/d{1,2}/d{4})\b.+?\b(?<number>d+(?:.d*)?)\b";

//var regex = /PSA(?:\s*,?\s*(?:(?:CANCER MONITORING)|SCREENING))?\s+(\d+(?:\.\d*)?)\s+(?:\(H\)\s+)?(\d{1,2}\/\d{1,2}\/\d{4})/;
var regex = null; // will be initialized from regex_template and this what is used to parse input
//var regex = /(\d+(?:\.\d*)?).+(\d{1,2}\/\d{1,2}\/\d{4})/;

var parsedTable; // this table is created at runtime.
var min_date; // earliest day we have in our table (we start w/ today as being a max value)
var max_date;
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
  LOG(
    "validate_regex_box  isvalid",
    isValid,
    "regex.toString()",
    regex.toString()
  );
}

function raw_regex(r) {
  // drops the starting and ending '/' of a regex string representation
  // which confuses the process of going back and forth from RegExp to regex_string representation
  LOG("R", r);
  ans = r.toString();
  LOG("ans length", ans.length);
  if (ans.charAt(0) == "/") {
    ans = ans.slice(1);
    //LOG("ans slice:", ans);
  }
  if (ans.charAt(ans.length - 1) == "/") {
    //LOG("char at length -1: ",ans.charAt(ans.length - 1) );
    ans = ans.slice(0, ans.length - 1);
  }
  //LOG("ans:", ans);
  return ans;
}

function processRegExp(orig) {
  processed = orig.replace(/\s+/g, raw_regex(RegExp(/.+?/).toString()));

  processed = processed.replace(
    /PSA/i,
    raw_regex(RegExp(/\b(?<number>\d+(?:\.\d*)?)\b/).toString())
  );
  processed = processed.replace(
    /\bDATE\b/i,
    raw_regex(RegExp(/\b(?<date>\d{1,2}\/\d{1,2}\/\d{4})\b/).toString())
  );
  LOG("processed:", processed);
  return processed;
}

function template_to_regex_str() {
  text = document.getElementById("entry").value;

  processed = processRegExp(regex_template);

  if (RegExp(processed).test(text) == true) {
    //LOG("I am true!!!");
    var e = document.getElementById("regex");
    e.value = processed;
    validate_regex_box();
    return;
  } else if (RegExp(processed).test(text) == false) {
    //LOG("I am false!!!");
    processed = processRegExp(regex_template_2);
    var e = document.getElementById("regex");
    e.value = processed;
    validate_regex_box();
    return;
  }
}

function load_regex_template() {
  var e = document.getElementById("regex_template");
  //e.value = regex_template;
}

function show_regex() {
  regex_str = template_to_regex_str();
  //LOG(`show_regex {${regex_str}}`);
  var e = document.getElementById("regex");
  e.value = regex_str;
  validate_regex_box();
}

function myOnload() {
  load_regex_template();

  discardedElem = document.getElementById("discarded");
}

function onlySpaces(str) {
  return str.trim().length === 0;
}

function data(data) {
  if (data == "data1") {
    document.getElementById("entry").value =
      document.getElementById("text_dataset_1").value;
    parse();
  } else if (data == "data2") {
    document.getElementById("entry").value =
      document.getElementById("text_dataset_2").value;
    parse();
  } else {
    document.getElementById("entry").value =
      document.getElementById("text_dataset_3").value;
    parse();
  }
}

function clearInput() {
  document.getElementById("entry").value = "";
  document.getElementById("discarded").value = "";
  document.getElementById("discard_lines").innerHTML = "Discarded Data:";
  document.getElementById("regex").value = "";
  document.getElementById("PSA_calc").setAttribute("style", "display:none");
  document
    .getElementById("scatterplotdiv")
    .setAttribute("style", "display:none");
  update_num_discarded(0);
  document.querySelector("#psadt_years_button").innerHTML = "Copy";
  document.querySelector("#psadt_months_button").innerHTML = "Copy";
  document.querySelector("#psadt_years_button").className =
    "btn btn-outline-success";
  document.querySelector("#psadt_months_button").className =
    "btn btn-outline-success";
}

function update_num_discarded(n) {
  var discardedLineTextBox = document.getElementById("num_discarded");
  var discardLineText = document.getElementById("discard_lines");
  discardedLineTextBox.innerHTML = `Number of lines discarded = ${n}`;
  if (n >= 1) {
    if (n == 1) {
      discardLineText.innerHTML = "Discarded Data (" + n + " line):";
      document.getElementById("discarded").rows = n;
    } else {
      discardLineText.innerHTML = "Discarded Data (" + n + " lines):";
      document.getElementById("discarded").rows = n;
    }
  } else {
    document.getElementById("num_discarded").value = "";
    document.getElementById("discarded").rows = "1";
  }
}

function parse() {
  template_to_regex_str();
  text = document.getElementById("entry").value;
  document.getElementById("PSA_calc").setAttribute("style", "display:block");
  PSA_text_edit = text.split("\n");
  min_date = new Date();
  cleaned = new Array();
  discarded = "";
  num_discarded = 0; // number of lines discarded
  //LOG("parse: regex.toString()", regex.toString);

  for (const line of PSA_text_edit) {
    if (line.match(/FREE/i)) {
      if (discarded != "") {
        // need to add  new line if have some previous
        discarded += "\n";
      }
      //discarded += `${line}`;
      discarded += line.trim();
      num_discarded++;
      continue;
    }

    m = line.match(regex);

    if (!m) {
      LOG("!m: ", m);
      // does this line match our regEx? If not....
      if (!onlySpaces(line)) {
        // just ignore blank lines totally
        if (discarded != "") {
          // need to add  new line if have some previous
          discarded += "\n";
        }
        discarded += line.trim();
        //discarded += `${line}`;
        num_discarded++;
      }
      continue; // line did not match, go to next
    }
    cleaned.push(line); // This line matched, it is saved for further processing
  }

  if (discarded.length > 0) {
    LOG("discarded", discarded.length, discarded);
    discardedElem.value = discarded;
    update_num_discarded(num_discarded);
  }
  
  GenerateTable(cleaned);
  return;
}

function sortTable() //sorts the table
{
  
    var rows, switching, i, x, y, shouldSwitch;
   
    switching = true;
  
    while (switching) {
      // Start by saying: no switching is done:
      switching = false;
      rows = parsedTable.rows;
     // LOG("ROWS,",rows);
      /* Loop through all table rows (except the
      first, which contains table headers): */
      LOG("rows length: ",rows.length);
      for (i = 1; i < (rows.length - 1); i++) {
        // Start by saying there should be no switching:
        shouldSwitch = false;
        /* Get the two elements you want to compare,
        one from current row and one from the next: */
        x = rows[i].getElementsByTagName("TD")[1];
        date_x = new Date(x.innerHTML);
        y = rows[i + 1].getElementsByTagName("TD")[1];
        date_y = new Date(y.innerHTML);
  
        if (date_x <  date_y) {
          // If so, mark as a switch and break the loop:
          LOG("In the loop");
          shouldSwitch = true;
          break;
        }
      }
      if (shouldSwitch) {
        rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
        switching = true;
      }
    }
    
}

function diff_days(dt2, dt1) {
  var diff = (dt2.getTime() - dt1.getTime()) / 1000;
  diff /= 60 * 60 * 24;
  return diff;
}

function reset_tables() {
  //sets PSA Data Table class
  parsedTable = document.createElement("TABLE");
  table_classes = "table table-bordered table-sm table-striped table-hover";
  parsedTable.setAttribute("class", table_classes);
  parsedTable.setAttribute("id", "TABLE");
  tabelHeader = parsedTable.createTHead();
  tabelHeader.className = "table-info";
  tableBody = parsedTable.createTBody();
}

function createCheckBox(parentCell, rowNum) {
  // creating checkbox element
  var checkbox = document.createElement("input");
  //var label_check = document.createElement("label");
  // Assigning the attributes to created checkbox
  myId = `derived_table_row_${rowNum}_checkbox`;
  checkbox.type = "checkbox";
  checkbox.name = myId;
  checkbox.value = myId;
  checkbox.checked = true;
  checkbox.id = myId;
  checkbox.style = "width:20px;height:20px";
  //checkbox.className = "form-check checkbox-lg";
  checkbox.onchange = function () {
    update_table(1);
  };

  // creating label for checkbox
  var label = document.createElement("label");

  // assigning attributes for the created label tag
  label.htmlFor = myId;
  //label.width="100%";

  // appending the created text to the created label tag
  label.appendChild(document.createTextNode("")); // we need no label in our use, just the checkbox

  // appending the checkbox  and label to div
  parentCell.appendChild(checkbox);
  parentCell.appendChild(label);
  return checkbox;
}

function GenerateTable(cleaned) {
  //Build an array containing Customer records.
  var input_label = [
    "PSA",
    "Date",
    "Days",
    "ln(PSA)",
    "Include in Calculation",
  ];

  reset_tables(); // parsedTable will be reset after this call.

  //Get the count of columns.
  columnCount = input_label.length;
  rowCount = cleaned.length; // 'cleaned' was generated by parse()
  
  
  // Fill out rest of 'input_table' add the data rows
  for (var i = 0; i < rowCount + 1; i++) {
    // +1 is for the header

    if (i > 0) {
      //MODIFY HERE
      row = tableBody.insertRow(-1);
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
        if (i == 0 && j == 0) {
          row_header = tabelHeader.insertRow(0);
        }
        cell = document.createElement("th");
        cell.style.textAlign = "center";
        cell.innerHTML = input_label[j]; // header values
        row_header.appendChild(cell);
      } 
      else {
        cell = row.insertCell(-1);
        cell.id = 'input_${i}_${j}'; // we will use this tag to retrieve values for calculations
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
            //LOG("cell.onchange");
            update_table(1);
          };
        } else if (j == 4) {
          // this will be the 'include in calc' checkbox
          cbox = createCheckBox(cell, i);
          //change style of textbox here? or CSS?
          cell.style.textAlign = "center";
        } else {
          cell.innerHTML = ""; // init the 'days' column with empty string (will be filled later)
        }
        LOG(i, j, cell);
      }
    }
  }
 
  sortTable();
  update_table(1);
}


function update_table(do_calc = 0) {
  max_date = min_date;
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

    if(date_x > max_date)
    {
      max_date = date_x;
    }  
    delta_d = diff_days(date_x, min_date);
    
    document.querySelector(`#input_${i}_2`).innerHTML = delta_d.toFixed(0);
    document.querySelector(`#input_${i}_2`).style.color = "black";
    document.querySelector(`#input_${i}_2`).align = "right";

    log_psa_value = Math.log(psa_value);
    document.querySelector(`#input_${i}_3`).innerHTML =
    log_psa_value.toFixed(2);
    document.querySelector(`#input_${i}_3`).style.color = "black";
    document.querySelector(`#input_${i}_3`).align = "right";
    //LOG(delta_d, psa_value)
    for_regression.push(new Array(delta_d, Math.log(psa_value)));
  }
  if (for_regression.length < 2) {
    alert("must have at least 2 PSA data samples\nSee discarded lines below");
    //document.getElementById("PSA_calc").setAttribute("style", "display:none");
    return;
  }
  
  if (do_calc) {
    //sortTable();
    do_regression(for_regression); //for_regression array with days and PSA
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
  document.getElementById("psadt_months_button").focus();
  psadt_months_elem = document.getElementById("psadt_months");
  psadt_months_elem.value = psadt_months.toFixed(1) + " Months";
  psadt_years_elem = document.getElementById("psadt_years");
  psadt_years_elem.value = psadt_years.toFixed(2) + " Years";
  //sortTable();
  //LOG()
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
    width: 1024,
    height: 768,
    //chartArea: { width: "25%", height: "25%" },
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
  var chart = new google.visualization.ScatterChart(
    document.getElementById("myChart")
  );
  chart.draw(data, options);
}

function scatterPlot() {
  var scatterPlotDiv = document.getElementById("scatterplotdiv");
  var scatterCheckBox = document.getElementById("scatter");
  if (scatterCheckBox.checked == true) {
    scatterPlotDiv.style.display = "block";
  } else {
    scatterPlotDiv.style.display = "none";
  }
}

function showRegEx() {
  var showRegExCheckBox = document.getElementById("showRegEx");
  var showRegExBox = document.getElementById("showRegExTextBox");
  if (showRegExCheckBox.checked == true) {
    showRegExBox.style.display = "block";
  } else {
    showRegExBox.style.display = "none";
  }
}

function discardedLines() {
  var discardedLineCheckBox = document.getElementById("discardedLines");
  var discardTemplate = document.getElementById("discardedLineTextBox");
  if (discardedLineCheckBox.checked == true) {
    discardTemplate.style.display = "block";
  } else {
    discardTemplate.style.display = "none";
  }
}

function copyPaste(copy_paste, button_id) 
{
  max_date_copy = getMMDDYY(max_date);
  min_date_copy = getMMDDYY(min_date);
  var copyText = document.querySelector(copy_paste);
  copyText.select();
  copyText.setSelectionRange(0, 99999); // For mobile devices
  navigator.clipboard.writeText("PSA Doubling Time: " + copyText.value + " ("+min_date_copy + " - "+max_date_copy+")");
  document.querySelector(button_id).className = "btn btn-success";
  document.querySelector(button_id).innerHTML = "Copied";
}

function demo() {
  var demoMode = document.getElementById("demoCheck");
  var demoButton = document.getElementById("demo");
  if (demoMode.checked == true) {
    demoButton.style.display = "block";
  } else demoButton.style.display = "none";
}
function getMMDDYY(date)
{
    var day = date.getDate();
    var month = date.getMonth()+1;
    var year = date.getFullYear();
    var date_corrected = month+"/"+day+"/"+year;
    return date_corrected;
}
