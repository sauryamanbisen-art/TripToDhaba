// Mobile menu toggle
const menuBtn = document.getElementById("menuBtn");
const menuList = document.getElementById("menuList");

menuBtn.addEventListener("click", () => {
    menuList.classList.toggle("show");
});
document.getElementById("menuBtn").onclick = function() {
    document.querySelector(".navbar").classList.toggle("active");
};
