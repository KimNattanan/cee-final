export async function randomImageUrl() {
  try {
    const response = await fetch(`https://api.nekosia.cat/api/v1/images/random`);
    const data = await response.json();
    return data.image.original.url;
  } catch (error) {
    return "/img/note_pc_error.png";
  }
}