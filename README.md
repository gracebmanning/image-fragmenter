# Image Fragmenter

Glitch your pics!! By [Grace Manning](https://graceis.online/).

## How it works:

The basis of image fragmenter is a script I wrote while playing around with image cropping effects in Python. The script will randomly choose a rectangular section of the image to crop; that crop is then pasted onto a random place on the original image. The next crop is taken from the original image, but pasted onto the latest image in the series. That is repeated NUM_LOOPS times. The DURATION is the number of seconds between frames when the GIF or video is generated.

### Original Python Script

```
import argparse
from PIL import Image
import random
import string
import os
import imageio.v3 as iio

NUM_LOOPS = 40
DURATION = 5


def create_images(image_filepath):
    original = Image.open(image_filepath)
    img = original.copy()
    filenames = []

    dir_name = ''.join(random.choices(
        string.ascii_letters + string.digits, k=8))
    os.mkdir(dir_name)

    img.save(f'./{dir_name}/img0.jpg')
    filenames.append(f'./{dir_name}/img0.jpg')

    width, height = img.size

    for i in range(NUM_LOOPS):
        left = random.randint(0, width)
        top = random.randint(0, height)
        right = left + random.randint(0, (width-left))
        bottom = top + random.randint(0, (height-top))

        crop = original.crop((left, top, right, bottom))
        img.paste(crop, (random.randint(0, width), random.randint(0, height)))
        filename = f'./{dir_name}/img{i+1}.jpg'
        img.save(filename)
        filenames.append(filename)

    images = []
    for file in filenames:
        images.append(iio.imread(file))

    iio.imwrite(f"./{dir_name}/animation.gif", images, duration=500, loop=0)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(prog="imageCropReplicator")
    parser.add_argument("image_file", help="Path to the input image file.")
    args = parser.parse_args()
    image_filepath = args.image_file
    create_images(image_filepath)

```

This code was converted into JavaScript for quick & easy compatibility in a React app.

## Thank you to...

| Item                          | Link                                                         |
| ----------------------------- | ------------------------------------------------------------ |
| Windows 98 Design System      | [98.css](https://jdan.github.io/98.css/)                     |
| Windows 98 Icons              | [Win98 Icons by Alex Meub](https://win98icons.alexmeub.com/) |
| GIF Image Effects Inspiration | [Gifuct-js](https://matt-way.github.io/gifuct-js/)           |
