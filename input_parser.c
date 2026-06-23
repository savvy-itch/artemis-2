/*
Parses input data from a CSV file into a JavaScript array object. 
The floats in CSV must have "." as decimal separators and ";" as column separators. 
For this implementation the relevant fields are:
Rx, Ry, Vx, Vy
*/
#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <string.h>

#define BASE_SIZE 100
#define ROW_LIMIT 9000
#define OUT_FILE_NAME "out.js"
#define OUT_PREFIX "export const INPUT_DATA = [\n"
#define OUT_SUFFIX "\n];"

void parse_to_js_arr(FILE *fp_out, char *buf, const int buf_size);

int main (int argc, char *argv[])
{
  FILE *fp, *fp_out;
  char *buf;
  int ch, buf_size;

  if (argc != 2) {
    fprintf(stderr, "usage: program filename\n");
    exit(EXIT_FAILURE);
  }
  
  if ((fp = fopen(argv[1], "rb")) == NULL) {
    fprintf(stderr, "cannot open %s\n", argv[1]);
    exit(EXIT_FAILURE);
  }
  
  if ((fp_out = fopen(OUT_FILE_NAME, "wb")) == NULL) {
    fprintf(stderr, "cannot open %s\n", OUT_FILE_NAME);
    exit(EXIT_FAILURE);
  }

  // skip the first line with column names
  while ((ch = getc(fp)) != '\n') {
    ;
  }
  printf("Skipped the first line\n");
  
  buf_size = BASE_SIZE;
  buf = malloc(buf_size);

  if (!buf) {
    fprintf(stderr, "failed to allocate memory\n");
    exit(EXIT_FAILURE);
  }

  /*
  remove unused columns. Only leave time, rx, ry, vx, vy
      0     1    2    3   4    5    6     7      8          9         10          11      12      13            14        15
  --------------------------------------------------------------------------------------------------------------------------------
  | TIME | Rx | Ry | Rz | Vx | Vy | Vz | MASS | WPSA | Budget WPSA | DS54 | Budget DS54 | DS24 | Budget DS24 | DS34 | Budget DS34 |
  --------------------------------------------------------------------------------------------------------------------------------
      ^     ^   ^         ^     ^
  */

  int i = 0, col_num = 0;
  // int row = 0;
  while ((ch = getc(fp)) != EOF) {
  // while ((ch = getc(fp)) != EOF && row < ROW_LIMIT) {
    if (ch == '\n') {
      // row++;
      col_num = 0;
    }

    // only need cols 0-2,4,5
    if (col_num < 6 && col_num != 3) {
      // allocate more memory
      if (i >= buf_size) {
        buf_size += BASE_SIZE;
        char *tmp = realloc(buf, buf_size);
        
        if (!tmp) {
          fprintf(stderr, "failed to allocate memory\n");
          free(buf);
          fclose(fp);
          exit(EXIT_FAILURE);
        }
        buf = tmp;
      }
      
      buf[i] = ch;
      i++;
    }
    
    // only look until column 5
    if (ch == ';' && col_num < 6) {
      col_num++;
    }
  }

  fclose(fp);
  i--;
  parse_to_js_arr(fp_out, buf, i);

  free(buf);
  fclose(fp_out);
  printf("The parsed data has been succesfully written to %s\n", OUT_FILE_NAME);
  return 0;
}

void parse_to_js_arr(FILE *fp_out, char *buf, const int buf_size)
{
  enum props { TIME_KEY, TIME_VAL, RX_KEY, RX_VAL, RY_KEY, RY_VAL, VX_KEY, VX_VAL, VY_KEY, VY_VAL };
  enum props cur_prop = TIME_KEY;

  fwrite(OUT_PREFIX, sizeof(OUT_PREFIX[0]), strlen(OUT_PREFIX), fp_out);
  
  int i = 0;
  while (i < buf_size) {
    switch (cur_prop) {
      case TIME_KEY:
        fprintf(fp_out, "{ time: ");
        cur_prop = TIME_VAL;
        break;
      case TIME_VAL:
        if (buf[i] == ';') {
          fprintf(fp_out, ", ");
          cur_prop = RX_KEY;
        } 
        // some lines might start with \n char
        else if (buf[i] != '\n') {
          putc(buf[i], fp_out);
        }
        i++;
        break;
      case RX_KEY:
        fprintf(fp_out, "rx: ");
        cur_prop = RX_VAL;
        break;
      case RX_VAL:
        if (buf[i] == ';') {
          fprintf(fp_out, ", ");
          cur_prop = RY_KEY;
        } else {
          putc(buf[i], fp_out);
        }
        i++;
        break;
      case RY_KEY:
        fprintf(fp_out, "ry: ");
        cur_prop = RY_VAL;
        break;
      case RY_VAL:
        if (buf[i] == ';') {
          fprintf(fp_out, ", ");
          cur_prop = VX_KEY;
        } else {
          putc(buf[i], fp_out);
        }
        i++;
        break;
      case VX_KEY:
        fprintf(fp_out, "vx: ");
        cur_prop = VX_VAL;
        break;
      case VX_VAL:
        if (buf[i] == ';') {
          fprintf(fp_out, ", ");
          cur_prop = VY_KEY;
        } else {
          putc(buf[i], fp_out);
        }
        i++;
        break;
      case VY_KEY:
        fprintf(fp_out, "vy: ");
        cur_prop = VY_VAL;
        break;
      case VY_VAL:
        if (buf[i] == ';') {
          fprintf(fp_out, ", },\n");
          cur_prop = TIME_KEY;
        } else {
          putc(buf[i], fp_out);
        }
        i++;
        break;
      default:
        break;
    }
  }
  
  fwrite(OUT_SUFFIX, sizeof(OUT_SUFFIX[0]), strlen(OUT_SUFFIX), fp_out);
}
