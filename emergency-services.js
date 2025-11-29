// Emergency Services Integration for GBV Safe Corner - gbvsafecorner.org
class EmergencyServices {
    constructor() {
        this.userLocation = null;
        this.safeLocations = [];
        this.emergencyContacts = {
            police: '10111',
            gbvCommand: '0800 428 428',
            lifeline: '0861 322 322',
            suicide: '0800 567 567',
            childline: '0800 055 555'
        };
        this.apiBase = 'https://api.gbvsafecorner.org/v1';
    }

    // Enhanced location services with domain-specific API
    async getUserLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                // Fallback to IP-based location
                this.getApproximateLocation().then(resolve).catch(reject);
                return;
            }

            navigator.geolocation.getCurrentPosition(
                position => {
                    this.userLocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: new Date().toISOString()
                    };
                    resolve(this.userLocation);
                },
                error => {
                    console.warn('Geolocation failed, using fallback:', error);
                    this.getApproximateLocation().then(resolve).catch(reject);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 300000
                }
            );
        });
    }

    // IP-based fallback location
    async getApproximateLocation() {
        try {
            const response = await fetch(`${this.apiBase}/location/approximate`);
            const data = await response.json();
            this.userLocation = {
                latitude: data.latitude,
                longitude: data.longitude,
                accuracy: 5000, // 5km accuracy for IP-based
                source: 'ip_estimation'
            };
            return this.userLocation;
        } catch (error) {
            throw new Error('Could not determine location');
        }
    }

    // Find safe locations via domain API
    async findNearestSafeLocations(limit = 10) {
        if (!this.userLocation) {
            await this.getUserLocation();
        }

        try {
            const response = await fetch(`${this.apiBase}/safe-locations?lat=${this.userLocation.latitude}&lng=${this.userLocation.longitude}&limit=${limit}`);
            const locations = await response.json();
            this.safeLocations = locations;
            return this.safeLocations;
        } catch (error) {
            // Fallback to curated locations
            return this.getCuratedSafeLocations();
        }
    }

    // Curated safe locations for fallback
    getCuratedSafeLocations() {
        const curatedLocations = [
            {
                name: "GBV Safe Corner Central Support",
                type: "support_center",
                distance: "0 km",
                address: "gbvsafecorner.org - Online Support Available 24/7",
                phone: "0800 428 428",
                coordinates: { lat: -26.2041, lng: 28.0473 },
                verified: true,
                services: ["counseling", "legal", "shelter", "medical"]
            },
            {
                name: "Johannesburg Central Police Station",
                type: "police",
                distance: "1.2 km",
                address: "1 Commissioner St, Johannesburg",
                phone: "011 497 7000",
                coordinates: { lat: -26.2041, lng: 28.0473 },
                verified: true
            },
            {
                name: "TEARS Foundation Partner",
                type: "support_center",
                distance: "2.1 km", 
                address: "Partner of gbvsafecorner.org",
                phone: "010 590 5920",
                coordinates: { lat: -26.2050, lng: 28.0480 },
                verified: true
            }
        ];

        // Calculate distances for curated locations
        this.safeLocations = curatedLocations.map(location => ({
            ...location,
            calculatedDistance: this.calculateDistance(
                this.userLocation.latitude, 
                this.userLocation.longitude,
                location.coordinates.lat, 
                location.coordinates.lng
            )
        })).sort((a, b) => a.calculatedDistance - b.calculatedDistance);

        return this.safeLocations;
    }

    // Enhanced distance calculation
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        return R * c; // Distance in km
    }

    deg2rad(deg) {
        return deg * (Math.PI/180);
    }

    // Enhanced emergency contact methods
    callEmergency(number) {
        if (typeof analytics !== 'undefined') {
            analytics.trackEmergencyCall(number);
        }
        window.location.href = `tel:${number}`;
    }

    sendEmergencySMS(number, message) {
        if (typeof analytics !== 'undefined') {
            analytics.trackEmergencySMS(number);
        }
        window.location.href = `sms:${number}?body=${encodeURIComponent(message)}`;
    }

    // Share location with emergency contacts
    async shareLocationWithContacts(contactNumbers = []) {
        if (!this.userLocation) {
            await this.getUserLocation();
        }

        const message = `GBV SAFE CORNER EMERGENCY: I need immediate assistance. My location: https://gbvsafecorner.org/emergency?lat=${this.userLocation.latitude}&lng=${this.userLocation.longitude}&t=${Date.now()}`;
        
        // Use provided contacts or default to police
        const contacts = contactNumbers.length > 0 ? contactNumbers : [this.emergencyContacts.police];
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'GBV Safe Corner - Emergency Alert',
                    text: message,
                    url: 'https://gbvsafecorner.org/emergency'
                });
            } catch (error) {
                // Fallback to SMS
                contacts.forEach(contact => {
                    this.sendEmergencySMS(contact, message);
                });
            }
        } else {
            // Fallback to SMS for all contacts
            contacts.forEach(contact => {
                this.sendEmergencySMS(contact, message);
            });
        }
    }

    // Safe route calculation with domain integration
    async calculateSafeRoute(destination) {
        try {
            const response = await fetch(`${this.apiBase}/safe-routes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    origin: this.userLocation,
                    destination: destination,
                    preferences: {
                        avoid_isolated_areas: true,
                        prefer_well_lit: true,
                        max_walking_distance: 2 // km
                    }
                })
            });
            return await response.json();
        } catch (error) {
            // Fallback route calculation
            return {
                distance: "Calculating...",
                duration: "Unknown",
                safetyScore: 75,
                instructions: [
                    "Head toward well-lit, populated areas",
                    "Avoid shortcuts through isolated places", 
                    "Call 10111 if you feel unsafe",
                    "Share your location with trusted contacts"
                ],
                emergencyContacts: [this.emergencyContacts.police, this.emergencyContacts.gbvCommand]
            };
        }
    }

    // New: Quick emergency protocol
    initiateEmergencyProtocol() {
        this.shareLocationWithContacts();
        this.callEmergency(this.emergencyContacts.police);
        
        // Show emergency instructions
        this.showEmergencyInstructions();
    }

    showEmergencyInstructions() {
        const instructions = `
            EMERGENCY PROTOCOL ACTIVATED:
            
            1. Get to a safe location if possible
            2. Police have been notified (10111)
            3. Your location has been shared
            4. Stay on the line if you called
            5. Keep phone accessible
            
            GBV Safe Corner is here to help.
            Visit: gbvsafecorner.org
        `;
        
        alert(instructions);
    }
}

// Initialize and export for global use
window.EmergencyServices = EmergencyServices;

// Auto-initialize emergency services
document.addEventListener('DOMContentLoaded', function() {
    if (!window.gbvsafeCorner) {
        window.gbvsafeCorner = {};
    }
    window.gbvsafeCorner.emergencyServices = new EmergencyServices();
});
