<template>
  <div>
    <div id="sceneWizard" class="hidden wizard">
      <div id="scene-type" class="active">
        <h4>
          What does this scene contain?
          <img class="next" src="v0/img/next-white.svg" />
        </h4>
        <label>
          <input type="checkbox" value="Sex/Nudity" />
          <b>Sex/Nudity</b>
        </label>
        <br />
        <label>
          <input type="checkbox" value="Violence" />
          <b>Violence/Gore</b>
        </label>
        <br />
        <label>
          <input type="checkbox" value="Other" />
          <b>Other</b>
        </label>
        <br />
      </div>
      <div id="sex-severity">
        <h4>
          <img class="prev" src="v0/img/prev-white.svg" />How graphic or erotic is it?
          <img class="next" src="v0/img/next-white.svg" />
        </h4>
        <label>
          <input type="radio" name="sex-severity" value="Non erotic" />
          <b>Non erotic</b> - Nudity with no erotic purpose, eg: Michelangelo's David, human
          corpse...
        </label>
        <br />
        <label>
          <input type="radio" name="sex-severity" value="Slightly erotic" />
          <b>Slightly erotic</b> - Slightly erotic or graphic scene, eg: brief kiss, revealing
          outfit, mild sexual reference...
        </label>
        <br />
        <label>
          <input type="radio" name="sex-severity" value="Moderately erotic" />
          <b>Moderately erotic</b> - Moderately erotic or graphic scene, eg: passionate kissing,
          provocative dancing, graphic sexual remarks...
        </label>
        <br />
        <label>
          <input type="radio" name="sex-severity" value="Very erotic" />
          <b>Very erotic</b> - Very erotic or graphic scene, eg: sex, foreplay, moaning...
        </label>
        <br />
      </div>
      <div id="sex-type">
        <h4>
          <img class="prev" src="v0/img/prev-white.svg" />Does it contain any of the following?
          <img class="next" src="v0/img/next-white.svg" />
        </h4>
        <label>
          <input type="checkbox" value="No consent" />
          <b>No consent</b> - Lack or inability to consent, eg: rape, child molestation,
          harassment...
        </label>
        <br />
        <label>
          <input type="checkbox" value="Unloving" />
          <b>Unloving/objectifying</b> - Limited intention to bond, care or look after the other,
          eg: one night stand, prostitution, striptease...
        </label>
        <br />
        <label>
          <input type="checkbox" value="Non-procreative" />
          <b>Non-procreative</b> - Sexual intercourse outside a procreative context, eg: oral sex,
          anal sex, masturbation, explicit use of contraception...
        </label>
        <br />
        <label>
          <input type="checkbox" value="Infidelity" />
          <b>Infidelity</b> - Unfaithfulness to a partner, eg: adultery...
        </label>
        <br />
        <!--<label><input type="checkbox" value="Sexual reference"> <b>Sexual reference</b> - Verbal or written sexual reference, eg: jokes, memories... </label><br>
        <label><input type="checkbox" value="Nudity/Immodesty"> <b>Nudity/immodesty</b> - eg: </label><br>-->
      </div>
      <div id="vio-severity">
        <h4>
          <img class="prev" src="v0/img/prev-white.svg" />How graphic/gore is it?
          <img class="next" src="v0/img/next-white.svg" />
        </h4>
        <label>
          <input type="radio" name="vio-severity" value="Non gore" />
          <b>Non gore</b> - Violence is implied but nothing is shown
        </label>
        <br />
        <label>
          <input type="radio" name="vio-severity" value="Slightly gore" />
          <b>Slightly gore</b> - Slightly gore or graphical scene, eg: mild verbal violence,
          punching
        </label>
        <br />
        <label>
          <input type="radio" name="vio-severity" value="Moderately gore" />
          <b>Moderately gore</b> - Moderately gore or graphical scene, eg: extensive bleeding,
          broken bones...
        </label>
        <br />
        <label>
          <input type="radio" name="vio-severity" value="Very gore" />
          <b>Very gore</b> - Very gore or graphical scene, eg: blood splattered, open wounds,
          guts...
        </label>
      </div>
      <div id="vio-type">
        <h4>
          <img class="prev" src="v0/img/prev-white.svg" />Does it contain any of the following?
          <img class="next" src="v0/img/next-white.svg" />
        </h4>
        <label>
          <input type="checkbox" value="Discrimination" />
          <b>Discrimination</b> - Verbal of physical violence due to race, sex, religion,
          disability...
        </label>
        <br />
        <label>
          <input type="checkbox" value="Cruelty" />
          <b>Cruelty</b> - Causing unnecessary pain/damage or finding pleasure in it, eg: torture
        </label>
        <br />
        <label>
          <input type="checkbox" value="Power imbalance" />
          <b>Power imbalance</b> - One of the parties is significantly weaker or have no chance of
          winning
        </label>
        <br />
        <label>
          <input type="checkbox" value="Self harm" />
          <b>Self harm</b> - Self inflicted pain or damage, eg: suicide...
        </label>
        <br />
        <!--<label><input type="checkbox" value="Accident"> <b>Accident/Medical</b> There is no intention to harm, eg: car accident, surgery without anaesthetic... </label><br>
        <label><input type="checkbox" value="Hand-to-hand"> <b>Fight/War</b></label><br>-->
      </div>
      <div id="other-type">
        <h4>
          <img class="prev" src="v0/img/prev-white.svg" />Which of the following does it contain?
          <img class="next" src="v0/img/next-white.svg" />
        </h4>
        <label>
          <input type="checkbox" value="Mild profanity" />
          <b>Mild profanity</b> - Mild language, eg: h*ll, d*mn...
        </label>
        <br />
        <label>
          <input type="checkbox" value="Strong profanity" />
          <b>Strong profanity</b> - Swear words
        </label>
        <br />
        <label>
          <input type="checkbox" value="Blasphemy" />
          <b>Blasphemy</b> - Speaking sacrilegiously about God or sacred things
        </label>
        <br />
        <label>
          <input type="checkbox" value="Legal drugs" />
          <b>Legal drugs</b> - Consumption of legal drugs, eg: alcohol, tobacco...
        </label>
        <br />
        <label>
          <input type="checkbox" value="Illegal drugs" />
          <b>Illegal drugs</b> - Consumption or dealing of illegal drugs, eg: weed, cocaine...
        </label>
        <br />
      </div>
      <div id="what-to-do">
        <h4>
          <img class="prev" src="v0/img/prev-white.svg" />Anything else?
          <img class="next" src="v0/img/next-white.svg" />
        </h4>
        <label>
          <input type="checkbox" value="Sound only" />
          <b>Sound only</b> - Tags apply only to sound
        </label>
        <br />
        <label>
          <input type="checkbox" value="Video only" />
          <b>Video only</b> - Tags apply only to video
        </label>
        <br />
        <label>
          <input type="checkbox" value="Local" />
          <b>Local</b> - Store only on your computer. Do not share it with others.
        </label>
        <br />
        <label>
          <input type="checkbox" value="Mild plot" />
          <b>Mild plot</b> - this scene is slightly important for the plot
        </label>
        <br />
        <label>
          <input type="checkbox" value="Strong plot" />
          <b>Strong plot</b> - this scene is very important for the plot
        </label>
        <br />
      </div>
      <div style="height: 30px; z-index: -1; visibility: hidden"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SceneWizard'
}
</script>

<style lang="scss" scoped></style>
