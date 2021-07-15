<template>
  <div class="size-wrapper">
    <br />
    <p>
      {{ $t('openValidProvider') }}
      <a href="https://www.netflix.com" target="_blank">Netflix</a>,
      <a href="https://es.hboespana.com/" target="_blank">HBO</a>,
      <a href="https://www.disneyplus.com/" target="_blank">Disney Plus</a>,
      <a href="https://ver.movistarplus.es/" target="_blank">Movistar Plus</a>, {{ $t('or') }}
      <a href="https://www.youtube.com/" target="_blank">Youtube.</a>
      <!-- Pending Amazon Prime Video -->
    </p>
    <p>
      <span v-html="$t('moreOnWebsite')"></span>
    </p>
  </div>
</template>

<script>
export default {}
</script>

<style lang="scss" scoped>
.size-wrapper {
  min-width: 300px;
}

p,
a {
  font-size: 14px;
}
</style>
