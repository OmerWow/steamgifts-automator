#!/bin/bash
 
exec >> /tmp/steamgifts_automator.log 2>&1
echo "Script started at $(date)"
cd /Users/omerelbaz/Documents/GitHub/steamgifts-automator || { echo "Failed to change directory"; exit 1; }
/usr/local/bin/bun /Users/omerelbaz/Documents/GitHub/steamgifts-automator/index.ts || echo "Bun command failed with exit code $?"
echo "Script ended at $(date)"
