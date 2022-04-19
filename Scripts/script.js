var cleaned;
var inputTable;


function onlySpaces(str) {
    return str.trim().length === 0;
}

function changeMe() {

    text = document.getElementById("entry").value;
    console.log('text', text)
    PSA_text_edit = text.split("\n");
    console.log('PSA_text_edit', PSA_text_edit)
    //------------------

    cleaned = new Array();
  
    for (const line of PSA_text_edit) {
        if (onlySpaces(line)) continue;
        if (line.startsWith("Basename")) continue;
        cleaned.push(line)
    }

    console.log('cleaned', cleaned)
    GenerateTable();
    return;
    //alert(PSA_text_edit);

    for (let i = 0; i < PSA_length; i++) {
        PSA[i] = PSA_text_edit[i].split(/\s+/);
        PSA[i].shift();
        PSA[i].shift();
        //alert(PSA[i]);
    }
    //call makeTable function
    makeTable(PSA, PSA_length);

}

function reset_tables() {
    var thead
    // fist, save the current input value
    inputTable = document.createElement("TABLE");
    inputTable.setAttribute("onkeyup", "UpdateCalcs();")

    table_classes = "table-striped  table-sm table-bordered table-hover"

    inputTable.border = "1";
}

function GenerateTable() {
    //Build an array containing Customer records.
    var input_label = ["PSA", "Date"]
    var row, header;

    reset_tables()

    //Get the count of columns.
    columnCount = input_label.length;
    rowCount = cleaned.length;
    console.log('rowCount', rowCount, 'columnCount', columnCount)

    // Fill out rest of 'input_table' add the data rows
    for (var i = 0; i < rowCount+1; i++) {  // +1 is for the header
        var row = inputTable.insertRow(-1);
        for (var j = 0; j < columnCount; j++) { // there is a label_column, then input value columns
            var cell = row.insertCell(-1);  // this will be <td> element
            if (i == 0) {
                cell.innerHTML = input_label[j];
            }
            else {
                cell.id = `input_${i}_${j}`    // we will use this tag to retrieve values for calculations
                cell.contentEditable = true
                cell.inputmode = "numeric"  // This does not seem to set on a table cell (need input element?)
                //last_value = getCurrentValue('input', i, j)
                // if (last_value != 0) cell.textContent = last_value
                //set_input_color(cell)
            }
        }
    }
    var inputTableElem = document.getElementById("PSA_data");
    inputTableElem.innerHTML = "";
    inputTableElem.appendChild(inputTable);
}

function clear() {
    document.getElementById("entry").row = 10;
}

function makeTable(PSA_table, length) {

    var row = new Array();
    var cell_info = new Array();
    var tbl = document.getElementById("PSA_data");
    var row_len = document.getElementById("PSA_data").getElementsByTagName('th');
    var row_length = row_len.length;
    var PSA_float = new Array();
    var Dates = new Array();
    var Months = new Array();
    var date_1 = new Date("12/30/1899");
    //alert(date_1.getTime());
    var difference_in_days = new Array();

    //make table
    for (let i = 0; i < length; i++) {
        row[i] = tbl.insertRow();

        for (let x = 0; x < row_length; x++) {
            cell_info[x] = row[i].insertCell();
            cell_info[x].innerHTML = PSA_table[i][x];

            if (x == 0 && i >= 0) {
                PSA_float[i] = Math.log2(parseFloat(PSA_table[i][x]));
                alert(PSA_float[i]);
            }
            else if (i >= 0 && x == 1) {
                Dates[i] = new Date(PSA_table[i][x]);
                Months[i] = Dates[i].getTime() - date_1.getTime();
                difference_in_days[i] = Months[i] / (1000 * 3600 * 24);
                alert(difference_in_days[i]);
            }

        }

    }
    var lr = ss.linearRegression([difference_in_days, PSA_float]);
    var lr_values = Object.values(lr);
    var slope = 1 / (lr_values[0]);
    alert("LR Value next");
    alert(lr_values[0]);
    alert(slope);

}

