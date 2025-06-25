import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from 'dotenv';
import path from 'path';
// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const BOKADIREKT_PERSON_ID = process.env.BOKADIREKT_PERSON_ID;
const BOKADIREKT_PERSON_NAME = process.env.BOKADIREKT_PERSON_NAME;
const BOKADIREKT_SERVICE_ID = process.env.BOKADIREKT_SERVICE_ID;
const BOKADIREKT_SALOON_ID = process.env.BOKADIREKT_SALOON_ID;
const server = new McpServer({
    name: "haircut-mcp",
    version: "1.0.0",
    manifests: {
        "claude": {
            schema_version: "v1",
            name_for_human: "Haircut Booking Tool",
            name_for_model: "haircut_booking",
            description_for_human: "Check haircut appointments from BokaDirekt.",
            description_for_model: "Tool for fetching available appointment times from BokaDirekt booking service.",
            auth: { type: "none" },
            api: { type: "mcp" }
        }
    }
});
server.tool("get-haircut-times", "Get available appointment times from BokaDirekt", async ({}) => {
    try {
        const response = await fetch(`https://www.bokadirekt.se/api/availability/${BOKADIREKT_SERVICE_ID}/${BOKADIREKT_SALOON_ID}/1753056000000/${BOKADIREKT_PERSON_ID}/1753048800000?reborn=true`);
        if (!response.ok) {
            throw new Error(`API request failed with status: ${response.status}`);
        }
        const data = await response.json();
        const availableTimes = data?.fromErp || [];
        // Process available times to make them more user-friendly
        const formattedTimes = availableTimes.map((slot) => {
            // Parse the date
            const startDate = new Date(slot.start);
            // Format date in a more readable format
            const formattedDate = startDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            // Format time
            const formattedTime = startDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            // Calculate end time
            const endTime = new Date(startDate.getTime() + slot.duration * 60000);
            const formattedEndTime = endTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            // Map employee ID to name
            const getEmployeeName = (employeeId) => {
                // Known employee mappings
                const employeeMap = {};
                if (BOKADIREKT_PERSON_ID && BOKADIREKT_PERSON_NAME) {
                    employeeMap[Number(BOKADIREKT_PERSON_ID)] = BOKADIREKT_PERSON_NAME;
                }
                return employeeMap[employeeId] || "Unknown";
            };
            return {
                id: `${startDate.getTime()}-${slot.employeeId}`,
                date: formattedDate,
                startTime: formattedTime,
                endTime: formattedEndTime,
                duration: `${slot.duration} minutes`,
                price: slot.employeePrices.priceLabel,
                employee: {
                    id: slot.employeeId,
                    name: getEmployeeName(slot.employeeId)
                }
            };
        });
        // Group appointments by date for better organization
        const groupedByDate = formattedTimes.reduce((acc, slot) => {
            if (!acc[slot.date]) {
                acc[slot.date] = [];
            }
            acc[slot.date].push(slot);
            return acc;
        }, {});
        // Calculate the current date for reference
        const currentDate = new Date();
        const formattedCurrentDate = currentDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        // Find unique employees in available slots
        const uniqueEmployees = [...new Set(formattedTimes.map(slot => slot.employee.name))];
        // Create a detailed message with specific available slots
        let detailedMessage = `AVAILABLE HAIRCUT APPOINTMENTS\n\n`;
        detailedMessage += `Found ${availableTimes.length} available time slot(s) with ${uniqueEmployees.join(', ')}:\n\n`;
        // Add detailed information about each available slot
        Object.keys(groupedByDate).forEach(date => {
            detailedMessage += `📅 ${date}:\n`;
            groupedByDate[date].forEach(slot => {
                detailedMessage += `   ✂️  ${slot.startTime} to ${slot.endTime} with ${slot.employee.name} (${slot.price})\n`;
            });
            detailedMessage += '\n';
        });
        detailedMessage += `\nTo book an appointment, please choose one of the times listed above.`;
        return {
            content: [
                {
                    type: "text",
                    text: detailedMessage
                }
            ],
            structuredContent: {
                today: formattedCurrentDate,
                totalAvailableSlots: availableTimes.length,
                availableDates: Object.keys(groupedByDate),
                appointmentsByDate: groupedByDate,
                employees: formattedTimes.length > 0 ?
                    [...new Set(formattedTimes.map(slot => slot.employee.id))].map(id => {
                        const slot = formattedTimes.find(s => s.employee.id === id);
                        return slot ? {
                            id,
                            name: slot.employee.name
                        } : null;
                    }).filter(Boolean) : [],
                priceRange: availableTimes.length > 0 ? {
                    min: Math.min(...availableTimes.map((slot) => slot.employeePrices.price)),
                    max: Math.max(...availableTimes.map((slot) => slot.employeePrices.price)),
                    currency: "SEK"
                } : null,
                rawData: availableTimes // Keep the raw data for reference if needed
            }
        };
    }
    catch (error) {
        console.error("Error fetching available times:", error);
        throw error;
    }
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("This MCP Server is running on stdio 🖥️");
}
main().catch((error) => {
    console.error("👎🏻 Fatal error in main():", error);
    process.exit(1);
});
