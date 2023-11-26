# Benchmarks

**System information:**
```
Package version: 6.1.1
CPU: Intel Core™ i7-10610U 1.8GHz
Cores: 8 (4 Physical)
RAM: 24GB
Disk: Samsung SAMSUNG MZVLW256HEHP-000L7 238GB SSD (NVMe)
OS: Microsoft Windows 11 Pro  (Windows)
Kernel: 10.0.22621 x64
Node: v20.10.0
V8: 11.3.244.8-node.25
```

## Asynchronous

> 4865 files & 745 directories

| Package              | ops/s | Error margin | % slower | 
|---------------------|-------|----------|-----------------| 
| fdir (v6.1.1)     | 76.1  | 1.38     | 2.81            | 
| fdir (v3.4.2)     | 78.3  | 1.04     | 0               | 
| fdir (v4.1.0)     | 77.8  | 1.13     | 0.64            | 
| fdir (v5.0.0)     | 78.1  | 0.98     | 0.26            | 
| recursive-fs      | 69.3  | 1.04     | 11.49           | 
| recur-readdir     | 1.7   | 1.5      | 97.83           | 
| recursive-files   | 15.3  | 4.22     | 80.46           | 
| recursive-readdir | 14.9  | 2.72     | 80.97           | 
| getAllFiles       | 68    | 0.96     | 13.15           | 
| node:fs.readdir   | 13.1  | 1.43     | 83.27           | 


## Synchronous

> 4865 files & 745 directories

| Package                 | ops/s | Error margin | % slower | 
|------------------------|-------|----------|-----------------| 
| fdir (v6.1.1)        | 32.9  | 1.24     | 0               | 
| fdir (v1.2.0)        | 32.1  | 0.91     | 2.43            | 
| fdir (v2.1.1)        | 31.8  | 0.87     | 3.34            | 
| fdir (v3.4.2)        | 31.5  | 1.28     | 4.26            | 
| fdir (v4.1.0)        | 29.7  | 0.79     | 9.73            | 
| fdir (v5.0.0)        | 29.9  | 0.61     | 9.12            | 
| get-all-files        | 28.9  | 0.57     | 12.16           | 
| all-files-in-tree    | 5.7   | 0.89     | 82.67           | 
| fs-readdir-recursive | 2.7   | 0.88     | 91.79           | 
| klaw-sync            | 5.8   | 0.93     | 82.37           | 
| recur-readdir        | 3     | 1.58     | 90.88           | 
| walk-sync            | 2.9   | 0.91     | 91.19           | 
| node:fs.readdirSync  | 29.1  | 0.72     | 11.55           | 

