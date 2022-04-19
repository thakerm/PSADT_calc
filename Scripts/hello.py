import numpy as np

from scipy import stats 
from datetime import datetime 

x = [32, 1]
y = [6, 2.2]
y_ln = np.log2(y)
print(y_ln)
slope = stats.linregress(x,y_ln)
slopes = 1/slope[0]
print(slopes)

