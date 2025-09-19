import 'babel-register';
 
import router from './router';
import Sitemap from '../';

function generateSitemap() {
  return (
    new Sitemap(router)
      .build('https://imagefragmenter.app')
      .save('./public/sitemap.xml')
  );
}

generateSitemap();