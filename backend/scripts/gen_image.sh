#!/bin/bash

# PER QUALCHE MOTIVO TEMP IMAGE VUOLE PNG E NON JPG

# Verifica la presenza dei parametri richiesti
if [ "$#" -ne 21 ]; then
    echo "Usage: $0 <temp_image> <final_image> <font_path> <offset> <text> <bg_image> <font_size> <font_color> <stroke_color> <text2> <font_path2> <offset2> <font_size2> <font_color2> <stroke_color2> <text3> <font_path3> <offset3> <font_size3> <font_color3> <stroke_color3>"
    exit 1
fi

temp_image="$1"
final_image="$2"
font_path="$3"
offset="$4"
text="$5"
bg_image="$6"
font_size="$7"
font_color="$8"
stroke_color="$9"
text2="${10}"
font_path2="${11}"
offset2="${12}"
font_size2="${13}"
font_color2="${14}"
stroke_color2="${15}"
text3="${16}"
font_path3="${17}"
offset3="${18}"
font_size3="${19}"
font_color3="${20}"
stroke_color3="${21}"

max_width=1920

original_width=$(identify -format "%w" "$bg_image")
original_height=$(identify -format "%h" "$bg_image")

# width is min{original_width, max_width}
# height is proportional to new width
width=$((original_width < max_width ? original_width : max_width))
height=$((width * original_height / original_width))

bg_image_2="$bg_image-resize.jpg"

# Ridimensiona l'immagine di sfondo
magick "$bg_image" -resize "$width"x"$height" "$bg_image_2"

# Aggiungi il primo testo con ombra
magick -size "$width"x"$height" xc:none -fill "$font_color" -font "$font_path" \
    -pointsize "$font_size" -gravity center -stroke "$stroke_color" -strokewidth 2 -annotate +0+"$offset" "$text" \
    \( +clone -background black -shadow 80x3+5+5 \) +swap -background none -layers merge +repage "$temp_image"

# Aggiungi il secondo testo senza ombra
magick "$temp_image" -fill "$font_color2" -font "$font_path2" -pointsize "$font_size2" -gravity center -stroke "$stroke_color2" -strokewidth 1 -annotate +0+"$offset2" "$text2" "$temp_image"

# Aggiungi il terzo testo senza ombra
magick "$temp_image" -fill "$font_color3" -font "$font_path3" -pointsize "$font_size3" -gravity center -stroke "$stroke_color3" -strokewidth 1 -annotate +0+"$offset3" "$text3" "$temp_image"

composite -gravity center -dissolve 100% -geometry +0+0 "$temp_image" "$bg_image_2" "$final_image"

# Rimuovi l'immagine temporanea
rm "$temp_image"
rm "$bg_image_2"
