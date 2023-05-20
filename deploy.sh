#!/bin/bash
REPOSITORY=/home/ubuntu/deploy 

cd $REPOSITORY

sudo npm ci

sudo pm2 kill

sudo pm2 start