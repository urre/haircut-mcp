# Haircut MCP

✂️ Get available haircut times from [Boka Direkt](https://www.bokadirekt.se/) for your salon, service and hairdresser.

_Why?:_

I book my hair appointments through Boka Direkt, a Swedish booking system. I wanted a convenient way to check available times with my hairdresser.

## Installation

```bash
npm i
```

## Claude Desktop setup

Edit `/Users/USERNAME/Library/Application Support/Claude/claude_desktop_config.json`

```bash
"mcp-haircut": {
	"command": "node",
	"args": [
		"/PATH/TO/THIS_FOLDER/haircut-mcp/build/index.js",
	],
	"env": {
		"BOKADIREKT_PERSON_ID": "XXX",
		"BOKADIREKT_PERSON_NAME": "XXX",
		"BOKADIREKT_SERVICE_ID": "XXX",
		"BOKADIREKT_SALOON_ID": "XXX",
		"DEBUG": "true"
	}
}
```
- **`BOKADIREKT_PERSON_ID`**: The unique ID of the person (e.g. the customer or user) in the Boka Direkt system.
- **`BOKADIREKT_PERSON_NAME`**: The name of the person associated with the above ID.
- **`BOKADIREKT_SERVICE_ID`**: The ID of the specific service being booked (e.g. haircut, coloring).
- **`BOKADIREKT_SALOON_ID`**: The ID of the salon or location where the service is offered.


## Build

```bash
npm run build
```

## Debug

Run the MCP Inspector on [http://127.0.0.1:6274/#resources](http://127.0.0.1:6274/#resources)

```bash
npx @modelcontextprotocol/inspector node /PATH/TO/haircut-mcp/build/index.js
```

## Usage

### Example prompt: "I need a haircut" or "Haircut times July 22?"

## Output in Claude Desktop

![](https://res.cloudinary.com/urre/image/upload/v1750845140/lxvtcbw9rnntloz3fgdn.png)

## License

[MIT](LICENSE)

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
