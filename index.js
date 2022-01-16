const core = require("@actions/core")
	, github = require("@actions/github")
	, http = require("https")
	, fs = require("fs").promises
	, FormData = require("form-data");

const API_DOMAIN = "https://api.esoui.com";

async function readFile(path, callback)
{
	try
	{
		callback(await fs.readFile(path, "utf8"));
	}

	catch (err)
	{
		console.error(err);
	}
}

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
			, dryRun = core.getInput("dryRun");

		const data = new FormData();
		data.append("id", +id);
		data.append("version", version);

		data.append(replaceMD(await fs.readFile(readmePath, "utf8")));
		data.append(await fs.readFile(changelogPath, "utf8"));
		data.append("updatefile", fs.createReadStream(artifact));

		let endpoint = API_DOMAIN + "/addons/update";
		if (dryRun)
			endpoint += "test";

		const request = http.request(endpoint, {
			method: "post",
			headers: {
				"x-api-token": apiToken,
				...data.getHeaders()
			}
		});

		data.pipe(request);
		request.on("response", res => console.log(res.statusCode));
	})();
}

catch (error)
{
	core.setFailed(error.message);
}
