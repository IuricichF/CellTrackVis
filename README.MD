# DataVis
Interactive Visualization - Cell Tracking

https://lygihub.github.io/DataVis/

Only dt4 has all 4 algorithms available; therefore, only dt4 has access to the Overall view at the moment. Only lap has data for all dt, and the rest of the algorithms have data only for dt4.


User Guide - How to input data

    Every field of view data is named as dataset_* from 1 to the total number of fields of view (indexes have to be continuous), and dataset_* is a folder that is consisted two parts: images and CSVs.

    Images are named as *.jpg from 0 to the total number of images - 1. If you want to use images in a different format, such as pdf, you do so by changing "jpg"s to your preferred format in lines 636 and 709 of index_initialization.js.

    CSV files are cell tracking data. CSV files are named as (name of the algorithm)_(frame rate).csv (e.g. lap_dt4.csv). If you want an algorithm to work on a certain frame rate, you need to ensure every dataset has CSV data for the algorithm and the frame rate.

    You need to enter and/or change lines 1, 2, and 3 of index_initialization.js to match your input data from the src folder.

    datasetNum is the total number of datasets. It should equal to the max number of dataset_* in the src folder.

    dtArr is avaliable frame rate options. dtArr[0] is the default frame rate.
    allAlgArr is avaliable algorithm options.