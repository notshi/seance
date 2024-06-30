
for idx in {1..25} ; do

echo image${idx}.jpg

magick image${idx}.jpg -resize 768x768 image${idx}.small.jpg

done

