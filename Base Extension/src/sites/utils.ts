export function createFocusOverlay(id: string): HTMLDivElement | null {
    if (document.getElementById(id)) {
        return null;
    }

    const overlay = document.createElement("div");
    overlay.id = id;
    
    const title = document.createElement("h1");
    title.textContent = "Time to Focus 📚";
    
    const subtitle = document.createElement("p");
    subtitle.textContent = "Read a book, learn something new, or build your dream project.";

    const sponsorLink = document.createElement("a");
    sponsorLink.className = "noalg-sponsor-link";
    sponsorLink.href = "https://github.com/sponsors/WarreTh";
    sponsorLink.target = "_blank";
    sponsorLink.rel = "noopener noreferrer";
    sponsorLink.textContent = "♥ Support No Algorithms";
    
    overlay.append(title, subtitle, sponsorLink);
    return overlay;
}