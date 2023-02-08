# Benchmarks

**System information:**

```
Package version: 6.0.0
CPU: Intel Core™ i7-10610U 1.8GHz
Cores: 8 (4 Physical)
RAM: 24GB
Disk: Samsung SAMSUNG MZVLW256HEHP-000L7 238GB SSD (NVMe)
OS: Microsoft Windows 11 Pro  (Windows)
Kernel: 10.0.22621 x64
Node: v18.14.0
V8: 10.2.154.23-node.22
```

## Asynchronous

> 9690 files & 1243 directories

| Package           | ops/s | Error margin | % slower |
| ----------------- | ----- | ------------ | -------- |
| fdir (v6.0.0)     | 46.9  | 2.87         | 1.47     |
| fdir (v3.4.2)     | 47.6  | 2.13         | 0        |
| fdir (v4.1.0)     | 41.2  | 6.99         | 13.45    |
| fdir (v5.0.0)     | 44.6  | 3.16         | 6.3      |
| recursive-fs      | 44.7  | 0.87         | 6.09     |
| recur-readdir     | 0.7   | 12.12        | 98.53    |
| recursive-files   | 6.3   | 5.07         | 86.76    |
| recursive-readdir | 7.2   | 7.46         | 84.87    |
| getAllFiles       | 43.9  | 1.73         | 7.77     |

## Synchronous

> 9690 files & 1243 directories

| Package              | ops/s  | Error margin | % slower |
| -------------------- | ------ | ------------ | -------- |
| fdir (v6.0.0)        | 18.342 | 2.41         | 8.52     |
| fdir (v1.2.0)        | 19.616 | 2.77         | 2.17     |
| fdir (v2.1.1)        | 20.051 | 0.62         | 0        |
| fdir (v3.4.2)        | 19.719 | 0.85         | 1.66     |
| fdir (v4.1.0)        | 18.869 | 0.67         | 5.89     |
| fdir (v5.0.0)        | 19.015 | 0.77         | 5.17     |
| get-all-files        | 16.882 | 0.66         | 15.8     |
| all-files-in-tree    | 3.093  | 1.37         | 84.57    |
| fs-readdir-recursive | 1.409  | 0.6          | 92.97    |
| klaw-sync            | 3.092  | 1.83         | 84.58    |
| recur-readdir        | 1.369  | 1.97         | 93.17    |
| walk-sync            | 1.63   | 1.34         | 91.87    |
