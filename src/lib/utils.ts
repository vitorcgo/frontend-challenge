import { createCn } from "cn/config"

// Tamanhos de fonte do tema (index.css): sem eles, `text-body` era lido como cor e apagava a cor do texto.
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [{ text: ["2xs", "tiny", "caption", "body", "md", "title", "display-sm", "display"] }],
    },
  },
})
