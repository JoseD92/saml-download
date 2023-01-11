.PHONY: extension
extension: extension.zip

extension.zip: distribution/manifest.json
	cd distribution && zip -r ../extension .