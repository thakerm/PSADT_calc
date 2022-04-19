
from distutils.log import debug
from flask import Flask, request, render_template
app = Flask(__name__)

@app.route('/', methods=["POST", "GET"])
def linearRegression():
    import numpy as np
    from scipy import stats 
    from datetime import datetime 
    if request.method =="POST":
        text = request.form['data']
        return(text)
    return render_template('lr.html')
  
    #x = [32, 1]
   # y = [6, 2.2]
   # #y_ln = np.log2(y)
   # slope = stats.linregress(x,y_ln)
    #slopes = 1/slope[0]
    #return(str(slopes))#

@app.route('/')
def lr():
   return render_template('lr.html')
    

if __name__ == "__main__":
    app.run(debug=True)