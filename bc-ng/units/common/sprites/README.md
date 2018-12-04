# /UNIT/sprites

Images in folders here will be available as sprites.

All images should be in their corresponding sprite folder so no:

`__common/sprites/img.png`

## Example

```

__common
	sprites
		toolbar
			sub1
				item_1.png
				item_2.png
			sub2
				item_2.png
				item_3.png
			item_1.png
			item_2.png
			item_3.png


			

// creates

__common
	css
		sprites
			toolbar.css
			toolbar.sub1.css
			toolbar.sub2.css
	img
		sprites
			toolbar.png
			toolbar.sub1.png
			toolbar.sub2.png
```		

