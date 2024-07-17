#!/bin/bash

# Define the order of files to concatenate
files=("./src/MerlinTetris.ts" "./src/TetrisConfig.ts" "./src/Tetris.ts")

# Delete existing output files if they exist
rm -rf dist

# Create a new file to store the concatenated content
outputFile="oneFile.ts"
> $outputFile

echo "Starting concatenation process..."

# Loop through each file, remove export keyword, delete import lines, and append content to the output file
for file in "${files[@]}"
do
    if [[ -f $file ]]; then
        echo "Processing $file..."
        # Read the file line by line, remove export keyword, delete import lines, and append to the output file
        sed -e 's/export //' -e '/^\s*import/d' $file >> $outputFile
    else
        echo "File $file does not exist."
    fi
done

echo "Concatenation complete. Running TypeScript compiler..."

# Run TypeScript compiler on the concatenated file
tsc

echo "TypeScript compilation complete."