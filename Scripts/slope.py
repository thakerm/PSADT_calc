import numpy as np
x = [4, 8]
y = [5, 10]
slope, intercept = np.polyfit(x,y,1)
print(slope)