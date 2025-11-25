---
title: macos 安装 minikube
categories:
  - k8s
date: 2025-11-25 09:46:01
tags:
  - k8s
  - minikube
  - macos
index_img:
banner_img:
---

## 使用 Homebrew 安装 -> [官方文档](https://minikube.kubernetes.ac.cn/docs/start/?arch=%2Fmacos%2Farm64%2Fstable%2Fhomebrew)

```shell
brew install minikube
```

安装完以后通过 start 启动

```shell
minikube start
```

然后大概率会因为基础镜像拉取不下来，自动更换了代理重新拉取。如果你忍受不了这个下载速度，可以自己拉取。

![](minikube/minikube_01.png)

### 更换阿里镜像源拉取基础镜像

> 请将命令中的 v0.0.48 替换成你在 minikube start 命令中看到的基础镜像版本

```shell
docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/kicbase:v0.0.48
```

拉取下来以后指定镜像来启动 minikube

```shell
minikube start --base-image='registry.cn-hangzhou.aliyuncs.com/google_containers/kicbase:v0.0.48'
```