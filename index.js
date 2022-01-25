const core = require("@actions/core")
	, github = require("@actions/github")
	, request = require("request")
	, { createReadStream } = require("fs")
	, { readFile } = require("fs").promises;

const API_DOMAIN = "https://api.esoui.com";

function replaceMD(text)
{
	text = text.replace(/^# (.*?)\n/gm,"[SIZE=5]$1[/SIZE]\n");
	text = text.replace(/^## (.*?)\n/gm,"[SIZE=4]$1[/SIZE]\n");
	text = text.replace(/^### (.*?)\n/gm,"[SIZE=3]$1[/SIZE]\n");
	text = text.replace(/`((?!`).*?)`/gm,"[Highlight]$1[/Highlight]");
	text = text.replace(/```(.*?)```/gm,"[Highlight=lua]$1[/Highlight]");
	return text;
}

try
{
	(async function main()
	{
		const readmePath = core.getInput("readme")
			, changelogPath = core.getInput("changelog")
			, apiToken = core.getInput("EsoUIToken")
			, id = core.getInput("EsoUIID")
			, version = core.getInput("version")
			, artifact = core.getInput("artifact")
			// , dryRun = core.getInput("dryRun");
			, dryRun = "false";

		let endpoint = API_DOMAIN + "/addons/update";
		if (dryRun.toLowerCase() === "true")
			endpoint += "test";

		console.log("Final endpoint is", endpoint);
		request({
			method: "POST",
			json: true,
			uri: endpoint,
			headers: {
				"x-api-token": apiToken
			},
			formData: {
				id: +id,
				version,
				description: replaceMD(await readFile(readmePath, "utf8")),
				changelog: await readFile(changelogPath, "utf8"),
				updatefile: createReadStream(artifact)
			}
		}, function(err, res, body)
		{
			if (err)
				return core.setFailed(err.message);
			console.log("Upload successful:", body)
		});
	})();
}

catch (error)
{
	core.setFailed(error.message);
}
