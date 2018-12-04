## Templates & Bundles

Templates can be processed and served either as singles or if a directory_name.json is requested in groups as json objects.  You can define custom template groups in manifest.json.

Plan to support EJS and Jade, perhaps others later

Individual files will be processed with respective template engine and the resulting html will be the response object.  If you call `/__common/tpl/file_1.ejs`, it can include `./includes/inc_1.ejs` and `./includes/inc_2.ejs` and they will be processed and the response will be one file representing the processed template.

Front end can call for any file individually, but if the front end calls for a folder, all templates in the folder will be processed and the response object will be a json object with each template as a relative path name.  For example:

```

request to /__common/tpl/bundle will look like...

{
	"file_a.jade":	"PROCESSED_CONTENT_STRING",
	"file_b.haml":	"PROCESSED_CONTENT_STRING",
	"file_c.ejs":	"PROCESSED_CONTENT_STRING"
}

```
If you want to cherry pick templates for a particular bundle, use /UNIT/manifest.js and define tpl.bundles:

```

exports.tpl = {
	bundles: {
		special_bundle1: [
			'units/other_unit_with_common_stuff/tpl/that_cool_reusable_area/bad_ass_modal.ejs',
			'node_modules/some_plugin/template.tpl --engine ejs --prop template.ejs',
			'bower_components/some_extension/template.tpl --engine jade --prop template.jade'
		]
	}
};

```

So when you call `/unit_name/tpl/.custom/special_bundle1` you'll get...

```

{
	"bad_ass_modal.ejs":	"PROCESSED_CONTENT_STRING",
	"template.ejs":			"PROCESSED_CONTENT_STRING",
	"template.jade":		"PROCESSED_CONTENT_STRING"
}

```