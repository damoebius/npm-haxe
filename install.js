var os = require('os');
var Download = require('download');
var Fs = require('fs-extra');
var fs = require('fs');
var path = require('path');

var TMP = './tmp';
var CURRENT = './current';

var packageVersion = process.env.npm_package_version;

function getConfig(key) {
	return process.env[ 'npm_package_config_' + key ];
}

var majorVersion = getConfig('version');
var extractedDirectory = 'haxe-' + majorVersion;
var nightly = getConfig('nightly');

var platform = os.platform();
var arch = os.arch();

clean( function(err){
	if( err != null ) {
		console.error(err);
	} else {
		download();
	}
} );

function clean(cb) {
	Fs.emptyDir(TMP, function(err){
		if( err != null ){
			cb( err );
		} else {
			Fs.remove(CURRENT, cb);
		}
	});
	
}

function download() {

	console.log("Getting Haxe " + majorVersion + (nightly ? " (nightly=" + nightly + ")" : "") );

	var url = haxeUrl(platform, arch);

	console.log("Downloading " + url );

	Download({ extract: true })
		.get( url )
		.dest( TMP )
		.run( onExtracted );
}

function onExtracted( err, files ) {
	if( err ) {
		console.error("Unable to download or extract Haxe.");
		throw err;
	}

	Fs.move( path.join(TMP, extractedDirectory) , CURRENT , function(err){
		if( err ) {
			console.error( err );
			throw err;
		}

		fs.chmodSync(path.join(CURRENT, 'haxe'), '755');
		fs.chmodSync(path.join(CURRENT, 'haxelib'), '755');
		
	});

}

function haxeUrl( platform, arch ) {
	var version = majorVersion;
	var isNightly = !!nightly;

	var url;
	switch ( isNightly ) {
		case true: 
			url = 'http://hxbuilds.s3-website-us-east-1.amazonaws.com/builds/haxe/';
			switch( platform ) {
				case 'linux':
					url += 'linux';
					switch( arch ) {
						case 'x64': 
							url += '64';
							break;
						case 'ia32':
							url += '32';
							break;
					}
					break;
				case 'darwin':
					url += 'mac';
					break;
				case 'win32':
				case 'win64':
					url += 'windows';
					break;
			}
			url += '/haxe_'+nightly+'.tar.gz';
			break;
		default: 
			url = 'http://haxe.org/website-content/downloads/' + version + '/downloads/haxe-' + version + '-';
			switch ( platform ) {
				case 'linux': 
					url += 'linux';
					switch( arch ) {
						case 'x64': 
							url += '64';
							break;
						case 'ia32':
							url += '32';
							break;
					}
					url += '.tar.gz';
					break;
				case 'darwin':
					url += 'osx';
					url += '.tar.gz';
					break;
				case 'win32':
				case 'win64':
					url += 'win32';
					url += '.zip';
					break;
				default: 
					console.error('Haxe is not compatible with your platform');
					throw 'error';
			}
	}
	
	return url;
}