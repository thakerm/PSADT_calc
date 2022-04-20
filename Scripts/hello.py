import numpy as np

from scipy import stats 
from datetime import datetime 

x = [32, 1]
y = [6, 2.2]
y_ln = np.log(y)   # natural log (base 'e')
print(y_ln)
slope = stats.linregress(x,y_ln)  # slope is tuple (m, b) for m*x+b line
slopes = np.log(2)/slope[0]
print(slopes)

