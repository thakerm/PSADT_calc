
function changeMe()
{
    
    
    var text = new Array();
     text = document.getElementById("entry").value;
    //------------------

    //clear text box and minimize 
    document.getElementById("entry").value = "";
    document.getElementById("entry").rows = 1;
    document.getElementById("entry").placeholder = "Copy more PSA data please";
    //Clean text data

    var PSA = new Array();
    var PSA_data = new Array();
    var PSA_text_edit = new Array();
     PSA_text_edit = text.split("\n");


    if (PSA_text_edit[0].startsWith("Basename")==true){
        PSA_text_edit.shift(); //remove the first line 
    }
    var PSA_length = PSA_text_edit.length;
    
    //check if the last line is empty, if yes then remove 
    if (PSA_text_edit.slice(-1)=="")
    {
        PSA_text_edit.pop();
        PSA_length = PSA_text_edit.length;
    }

    
    //alert(PSA_length);
    //alert(PSA_text_edit);

    for (let i=0;i<PSA_length;i++)
    {
        PSA[i] = PSA_text_edit[i].split(/\s+/);
        PSA[i].shift();
        PSA[i].shift();
        //alert(PSA[i]);
    }
    //call makeTable function
    makeTable(PSA, PSA_length);

}

function clear()
{
    document.getElementById("entry").row = 10;


}

function makeTable (PSA_table, length)
{
   
    var row = new Array();
    var cell_info = new Array();
    var tbl = document.getElementById("PSA_data");
    var row_len = document.getElementById("PSA_data").getElementsByTagName('th');
    var row_length = row_len.length;
    var PSA_float = new Array();
    var Dates = new Array ();
    var Months = new Array ();
    var date_1 = new Date("12/30/1899");
    //alert(date_1.getTime());
    var difference_in_days = new Array();

    //make table
    for (let i = 0; i<length;i++)
    {
        row[i] = tbl.insertRow();

        for (let x = 0;x<row_length;x++)
        {
            cell_info[x] = row[i].insertCell();
            cell_info[x].innerHTML = PSA_table[i][x];

            if (x==0 && i>=0)
            {
                PSA_float[i] = Math.log2(parseFloat(PSA_table[i][x]));
                alert(PSA_float[i]);
            }
            else if (i>=0 && x==1) 
            {
                Dates[i] = new Date(PSA_table[i][x]);
                Months[i] = Dates[i].getTime() - date_1.getTime();
                difference_in_days[i]=Months[i]/(1000*3600*24);
                alert(difference_in_days[i]);
            }
     
        }
       
    }
    var lr = ss.linearRegression([difference_in_days,PSA_float]);
    var lr_values = Object.values(lr);
    var slope = 1/(lr_values[0]);
    alert("LR Value next");
    alert(lr_values[0]);
    alert(slope);

}
