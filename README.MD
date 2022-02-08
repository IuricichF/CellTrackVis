## CellTrackViz

Interactive Visualization of cell tracking algorithm performance

---


### Interactive example

An online example of CellTrack Viz can be found [here](https://iuricichF.github.io/DataVis/)
To run the example locally you can simply download this repository and run a local server on your machine.


### User Guide

#### Input format
---

Inputs consist of two data types, images and CSV files containing the tracking algorithms' results.

Images are contained in folder `src/`. Each folder contains the sequence of images, in `*.jpg` format, composing a specific field of view.

CSV fiels are contained in the folder `src/results`. Each folder contains the results collected with a specific algorith. Inside that folder you can find one CSV file per field of view. For each file, lines indicate `...`. For each line we have

- `...`
- `...`
- `...`
- `...`

```
Unnamed: 0,FRAME,ID,track_id_unique,track_id_parent,pos_x,pos_y,dt10_n0_dx,dt10_n0_dy,tid_lap_pred,ID_next,dist_link,u_flag,track_id_unique_pred,track_id_parent_pred,predicted
0,0,3085231,46,0,1652.1372624229334,1369.5648534039744,2.1463759769437734,-8.19148508678586,1,3085575,8.468019707194737,0,1,0,0
```


#### Updating the input
---

Regardless of the files ontained in the `src\` the standalone version of CellTrackViz in this repository allows to edit the field of view and algorithms considered at loading time.

The list of algorithms to consider can be modified by updating line [put line once final]().

The list of field of views can be modified by updating [put line once final]().
