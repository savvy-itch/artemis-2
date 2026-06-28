# Artemis II Flight Trajectory
Artemis II flight trajectory 2D simulation. Inspired by but not part of the NASA App Development Challenge 2025.

Input data and general instructions taken from [NASA ADC 2025](https://www.nasa.gov/learning-resources/app-development-challenge/adc-handbook-and-coding-componets-2025/).

## Development
To obtain input data for the simulation, C parser from `input_parser.c` must be used. It parses input data from a CSV file into a JavaScript array of objects. The floats in CSV must have "." as decimal separators and ";" as column separators. 
To build the parser, run:
```
gcc -Wall -Wextra input_parser.c
```

Then generate input data array by running:
```
<program_name> <file_name>
```
 