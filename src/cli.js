import Vorpal from "vorpal";

const vorpal = Vorpal();

vorpal
  .command("say [words...]")
  .option("-b, --backwards")
  .option("-t, --twice")
  .action((args, callback) => {
    let str = args.words.join(" ");
    str = args.options.backwards ? str.split("").reverse().join("") : str;
    this.log(str);
    callback();
  });

vorpal.delimiter("quattuor$").show();
